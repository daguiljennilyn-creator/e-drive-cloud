<?php

namespace Tests\Feature\Api;

use App\Models\Document;
use App\Models\User;
use App\Services\Notifier;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_show_returns_profile_statistics(): void
    {
        $user = User::factory()->create();
        Document::factory()->for($user)->create([
            'size' => 2048,
            'is_favorite' => true,
        ]);
        Document::factory()->for($user)->create([
            'size' => 1024,
            'share_token' => 'shared-token',
            'share_expires_at' => now()->addDay(),
        ]);

        $this->actingAs($user);

        $this->getJson('/api/profile')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('stats.documents', 2)
            ->assertJsonPath('stats.shared', 1)
            ->assertJsonPath('stats.favorites', 1)
            ->assertJsonPath('stats.storage_used_bytes', 3072)
            ->assertJsonPath('stats.activities', 0);
    }

    public function test_update_changes_profile_fields(): void
    {
        $user = User::factory()->create(['name' => 'Old Name']);
        $this->actingAs($user);

        $this->putJson('/api/profile', [
            'name' => 'New Name',
            'company' => 'Northstar Labs',
            'job_title' => 'Operations Director',
            'phone' => '+1 (415) 555-0100',
            'bio' => 'Updated bio',
        ])->assertOk()
            ->assertJsonPath('user.name', 'New Name')
            ->assertJsonPath('user.company', 'Northstar Labs');

        $user->refresh();

        $this->assertSame('New Name', $user->name);
        $this->assertSame('Northstar Labs', $user->company);
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'profile_updated',
        ]);
    }

    public function test_update_rejects_an_email_used_by_another_account(): void
    {
        $user = User::factory()->create();
        User::factory()->create(['email' => 'taken@example.com']);

        $this->actingAs($user);

        $this->putJson('/api/profile', ['email' => 'taken@example.com'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertNotSame('taken@example.com', $user->fresh()->email);
    }

    public function test_update_password_changes_the_hash_and_clears_other_sessions(): void
    {
        config(['session.driver' => 'database']);

        $user = User::factory()->create();
        DB::table('sessions')->insert([
            'id' => 'other-session',
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
            'payload' => base64_encode(serialize([])),
            'last_activity' => now()->getTimestamp(),
        ]);

        $this->actingAs($user)
            ->postJson('/api/profile/password', [
                'current_password' => 'Password123!',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ])->assertOk()
            ->assertJsonPath('message', 'Password updated. Other sessions have been signed out.');

        $this->assertTrue(Hash::check('NewPassword123!', $user->fresh()->password));
        $this->assertDatabaseMissing('sessions', ['id' => 'other-session']);
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'password_changed',
        ]);
    }

    public function test_update_password_rejects_an_incorrect_current_password(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->postJson('/api/profile/password', [
            'current_password' => 'WrongPassword1!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('current_password');
    }

    public function test_export_streams_a_json_archive(): void
    {
        $user = User::factory()->create();
        Document::factory()->for($user)->create(['name' => 'Passport']);

        $this->actingAs($user);

        $this->get('/api/profile/export')
            ->assertOk()
            ->assertHeader('content-type', 'application/json');

        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'data_exported',
        ]);
    }

    public function test_destroy_requires_the_confirmation_phrase(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->deleteJson('/api/profile', [
            'password' => 'Password123!',
            'confirmation' => 'NO',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('confirmation');

        $this->assertDatabaseHas('users', ['id' => $user->id]);
    }

    public function test_destroy_deletes_the_user_documents_and_notifications(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create([
            'file_path' => 'documents/'.$user->id.'/private.pdf',
        ]);
        Storage::disk('local')->put($document->file_path, 'vault contents');
        Notifier::send($user, 'welcome', 'Welcome', 'Ready.');

        $this->actingAs($user)
            ->deleteJson('/api/profile', [
                'password' => 'Password123!',
                'confirmation' => 'DELETE',
            ])->assertOk()
            ->assertJsonPath('message', 'Your account and all encrypted files have been deleted.');

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('documents', ['id' => $document->id]);
        $this->assertDatabaseCount('notifications', 0);
        $this->assertGuest();
        Storage::disk('local')->assertMissing($document->file_path);
    }
}
