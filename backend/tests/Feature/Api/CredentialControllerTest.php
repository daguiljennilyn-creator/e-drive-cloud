<?php

namespace Tests\Feature\Api;

use App\Models\Credential;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CredentialControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_returns_401_when_credentials_are_requested_without_a_token(): void
    {
        $this->getJson('/api/credentials')->assertUnauthorized();
    }

    public function test_index_returns_only_the_authenticated_users_credentials_with_stats(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        Credential::factory()->for($user)->create([
            'name' => 'GitHub',
            'type' => 'password',
            'health' => 'strong',
        ]);
        Credential::factory()->for($user)->create([
            'name' => 'Laptop passkey',
            'type' => 'passkey',
            'health' => 'weak',
        ]);
        Credential::factory()->for($other)->create(['name' => 'Someone Else']);

        $this->actingAs($user);

        $this->getJson('/api/credentials')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('stats.total', 2)
            ->assertJsonPath('stats.passkeys', 1)
            ->assertJsonPath('stats.strong', 1)
            ->assertJsonPath('stats.types.passkey', 1);
    }

    public function test_index_filters_by_search_type_and_favorites(): void
    {
        $user = User::factory()->create();

        Credential::factory()->for($user)->create([
            'name' => 'GitHub account',
            'type' => 'password',
            'is_favorite' => true,
        ]);
        Credential::factory()->for($user)->create([
            'name' => 'Server key',
            'type' => 'ssh_key',
            'is_favorite' => false,
        ]);

        $this->actingAs($user);

        $this->getJson('/api/credentials?q=github')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'GitHub account');

        $this->getJson('/api/credentials?type=ssh_key')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Server key');

        $this->getJson('/api/credentials?favorites=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'GitHub account');
    }

    public function test_store_encrypts_the_secret_and_never_returns_it(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->postJson('/api/credentials', [
            'name' => 'GitHub',
            'type' => 'password',
            'identifier' => 'dev@example.com',
            'secret' => 'SuperSecret1!',
            'url' => 'https://github.com',
            'notes' => 'Work account',
            'two_factor_enabled' => true,
        ])->assertCreated()
            ->assertJsonPath('credential.name', 'GitHub')
            ->assertJsonPath('credential.has_secret', true)
            ->assertJsonMissingPath('credential.secret');

        $credential = Credential::firstOrFail();

        $this->assertSame('SuperSecret1!', $credential->secret);
        $this->assertNotSame('SuperSecret1!', DB::table('credentials')->value('secret'));
        $this->assertNotNull($credential->last_rotated_at);
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'credential_created',
        ]);
    }

    public function test_store_rejects_an_unknown_credential_type(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->postJson('/api/credentials', [
            'name' => 'GitHub',
            'type' => 'magic_link',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('type');

        $this->assertDatabaseCount('credentials', 0);
    }

    public function test_show_returns_403_for_another_users_credential(): void
    {
        $user = User::factory()->create();
        $credential = Credential::factory()->for(User::factory())->create();

        $this->actingAs($user);

        $this->getJson('/api/credentials/'.$credential->id)->assertForbidden();
    }

    public function test_reveal_returns_the_decrypted_secret_and_records_activity(): void
    {
        $user = User::factory()->create();
        $credential = Credential::factory()->for($user)->create([
            'secret' => 'TopSecret9!',
            'identifier' => 'dev@example.com',
        ]);

        $this->actingAs($user);

        $this->getJson('/api/credentials/'.$credential->id.'/reveal')
            ->assertOk()
            ->assertJsonPath('secret', 'TopSecret9!')
            ->assertJsonPath('identifier', 'dev@example.com');

        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'credential_revealed',
        ]);
    }

    public function test_reveal_returns_403_for_another_users_credential(): void
    {
        $user = User::factory()->create();
        $credential = Credential::factory()->for(User::factory())->create();

        $this->actingAs($user);

        $this->getJson('/api/credentials/'.$credential->id.'/reveal')->assertForbidden();
    }

    public function test_rotate_marks_the_credential_strong_and_sends_a_notification(): void
    {
        $user = User::factory()->create();
        $credential = Credential::factory()->for($user)->create([
            'health' => 'weak',
            'secret' => 'OldSecret1!',
            'last_rotated_at' => now()->subDays(90),
        ]);

        $this->actingAs($user);

        $this->postJson('/api/credentials/'.$credential->id.'/rotate', [
            'secret' => 'NewSecret2!',
        ])->assertOk()
            ->assertJsonPath('credential.health', 'strong')
            ->assertJsonPath('credential.has_secret', true);

        $credential->refresh();

        $this->assertSame('strong', $credential->health);
        $this->assertSame('NewSecret2!', $credential->secret);
        $this->assertTrue($credential->last_rotated_at->isToday());
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'credential_rotated',
        ]);
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $user->id,
            'notifiable_type' => User::class,
        ]);
    }

    public function test_import_creates_multiple_credentials(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->postJson('/api/credentials/import', [
            'credentials' => [
                [
                    'name' => 'GitHub',
                    'type' => 'password',
                    'identifier' => 'dev@example.com',
                    'secret' => 'SecretOne1!',
                ],
                [
                    'name' => 'Production server',
                    'type' => 'ssh_key',
                    'notes' => 'Deployment key',
                ],
            ],
        ])->assertCreated()
            ->assertJsonPath('count', 2);

        $this->assertDatabaseCount('credentials', 2);
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'credentials_imported',
        ]);
    }

    public function test_import_rejects_an_invalid_entry(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->postJson('/api/credentials/import', [
            'credentials' => [
                ['name' => 'X', 'type' => 'unknown'],
            ],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['credentials.0.name', 'credentials.0.type']);

        $this->assertDatabaseCount('credentials', 0);
    }

    public function test_update_changes_the_credential_fields(): void
    {
        $user = User::factory()->create();
        $credential = Credential::factory()->for($user)->create([
            'name' => 'Old name',
            'notes' => 'Old notes',
        ]);

        $this->actingAs($user);

        $this->putJson('/api/credentials/'.$credential->id, [
            'name' => 'New name',
            'notes' => 'New notes',
            'is_favorite' => true,
        ])->assertOk()
            ->assertJsonPath('credential.name', 'New name')
            ->assertJsonPath('credential.is_favorite', true);

        $this->assertDatabaseHas('credentials', [
            'id' => $credential->id,
            'name' => 'New name',
            'notes' => 'New notes',
        ]);
    }

    public function test_destroy_deletes_the_credential(): void
    {
        $user = User::factory()->create();
        $credential = Credential::factory()->for($user)->create();

        $this->actingAs($user);

        $this->deleteJson('/api/credentials/'.$credential->id)
            ->assertOk()
            ->assertJsonPath('message', 'Credential deleted.');

        $this->assertDatabaseMissing('credentials', ['id' => $credential->id]);
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'credential_deleted',
        ]);
    }
}
