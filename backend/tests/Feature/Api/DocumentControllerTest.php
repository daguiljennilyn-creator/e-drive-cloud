<?php

namespace Tests\Feature\Api;

use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class DocumentControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_returns_401_when_documents_are_requested_without_a_token(): void
    {
        $this->getJson('/api/documents')->assertUnauthorized();
    }

    public function test_index_returns_only_the_authenticated_users_documents_with_stats(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        Document::factory()->for($user)->create([
            'name' => 'My Passport',
            'category' => 'government_id',
            'is_favorite' => true,
        ]);
        Document::factory()->for($user)->create([
            'name' => 'Home Insurance',
            'category' => 'personal',
        ]);
        Document::factory()->for($other)->create(['name' => 'Other Users File']);

        $this->actingAs($user);

        $this->getJson('/api/documents?per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('stats.total', 2)
            ->assertJsonPath('stats.favorite_count', 1)
            ->assertJsonPath('stats.category_counts.government_id', 1)
            ->assertJsonPath('stats.category_counts.personal', 1);
    }

    public function test_index_filters_documents_by_search_and_favorites(): void
    {
        $user = User::factory()->create();

        Document::factory()->for($user)->create([
            'name' => 'My Passport',
            'is_favorite' => true,
        ]);
        Document::factory()->for($user)->create(['name' => 'January Invoice']);

        $this->actingAs($user);

        $this->getJson('/api/documents?q=pass')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'My Passport');

        $this->getJson('/api/documents?favorites=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'My Passport');
    }

    public function test_store_uploads_a_document_and_records_activity(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post('/api/documents', [
            'file' => UploadedFile::fake()->create('passport.pdf', 12, 'application/pdf'),
            'name' => 'Passport',
            'category' => 'government_id',
            'subcategory' => 'identity',
            'description' => 'Current passport',
            'tags' => ['#identity', 'travel', 'travel'],
        ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('document.name', 'Passport')
            ->assertJsonPath('document.category', 'government_id')
            ->assertJsonPath('document.tags', ['identity', 'travel']);

        $document = Document::firstOrFail();

        $this->assertSame($user->id, $document->user_id);
        $this->assertSame('passport.pdf', $document->original_name);
        $this->assertSame('pdf', $document->extension);
        $this->assertSame('application/pdf', $document->mime_type);
        Storage::disk('local')->assertExists($document->file_path);
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'document_id' => $document->id,
            'action' => 'uploaded',
        ]);
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $user->id,
            'notifiable_type' => User::class,
        ]);
    }

    public function test_store_requires_a_file(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->postJson('/api/documents', [
            'name' => 'Passport',
            'category' => 'government_id',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('file');

        $this->assertDatabaseCount('documents', 0);
    }

    public function test_store_rejects_a_disallowed_file_extension(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $this->actingAs($user);

        $this->post('/api/documents', [
            'file' => UploadedFile::fake()->create('malware.exe', 1, 'application/x-msdownload'),
            'name' => 'Bad file',
            'category' => 'other',
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');

        $this->assertDatabaseCount('documents', 0);
    }

    public function test_store_rejects_an_upload_that_exceeds_available_storage(): void
    {
        Storage::fake('local');

        $user = User::factory()->create(['storage_limit_bytes' => 1024]);
        $this->actingAs($user);

        $this->post('/api/documents', [
            'file' => UploadedFile::fake()->create('large.pdf', 2, 'application/pdf'),
            'name' => 'Large file',
            'category' => 'other',
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'file' => 'This upload exceeds your available storage. Upgrade your plan or free up space.',
            ]);

        $this->assertDatabaseCount('documents', 0);
    }

    public function test_show_returns_403_for_another_users_document(): void
    {
        $user = User::factory()->create();
        $document = Document::factory()->for(User::factory())->create();

        $this->actingAs($user);

        $this->getJson('/api/documents/'.$document->id)->assertForbidden();
    }

    public function test_update_changes_document_fields_and_marks_it_verified(): void
    {
        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create([
            'name' => 'Old name',
            'category' => 'other',
            'status' => 'active',
        ]);

        $this->actingAs($user);

        $this->putJson('/api/documents/'.$document->id, [
            'name' => 'New name',
            'category' => 'school',
            'status' => 'verified',
            'description' => 'Updated description',
        ])->assertOk()
            ->assertJsonPath('document.name', 'New name')
            ->assertJsonPath('document.status', 'verified');

        $document->refresh();

        $this->assertSame('New name', $document->name);
        $this->assertSame('school', $document->category);
        $this->assertNotNull($document->verified_at);
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'document_id' => $document->id,
            'action' => 'updated',
        ]);
    }

    public function test_toggle_favorite_flips_the_favorite_flag(): void
    {
        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create(['is_favorite' => false]);

        $this->actingAs($user);

        $this->patchJson('/api/documents/'.$document->id.'/favorite')
            ->assertOk()
            ->assertJsonPath('document.is_favorite', true);

        $this->assertTrue($document->fresh()->is_favorite);

        $this->patchJson('/api/documents/'.$document->id.'/favorite')
            ->assertOk()
            ->assertJsonPath('document.is_favorite', false);

        $this->assertFalse($document->fresh()->is_favorite);
    }

    public function test_trashing_hides_the_document_until_it_is_restored(): void
    {
        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create();

        $this->actingAs($user);

        $this->deleteJson('/api/documents/'.$document->id)
            ->assertOk()
            ->assertJsonPath('message', 'Document moved to trash.');

        $this->assertSoftDeleted($document);
        $this->getJson('/api/documents')->assertJsonPath('stats.total', 0);
        $this->getJson('/api/documents?trashed=only')->assertJsonPath('meta.total', 1);

        $this->postJson('/api/documents/'.$document->id.'/restore')
            ->assertOk()
            ->assertJsonPath('document.name', $document->name);

        $this->assertNotSoftDeleted($document);
    }

    public function test_force_delete_removes_the_document_and_stored_file(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create([
            'file_path' => 'documents/'.$user->id.'/private.pdf',
        ]);
        Storage::disk('local')->put($document->file_path, 'vault contents');

        $this->actingAs($user);

        $this->deleteJson('/api/documents/'.$document->id)->assertOk();
        $this->deleteJson('/api/documents/'.$document->id.'/force')->assertOk();

        $this->assertDatabaseMissing('documents', ['id' => $document->id]);
        Storage::disk('local')->assertMissing($document->file_path);
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'deleted',
        ]);
    }

    public function test_bulk_trash_moves_all_selected_documents_to_trash(): void
    {
        $user = User::factory()->create();
        $documents = Document::factory()->for($user)->count(2)->create();

        $this->actingAs($user);

        $this->postJson('/api/documents/bulk', [
            'ids' => $documents->pluck('id')->all(),
            'action' => 'trash',
        ])->assertOk()
            ->assertJsonPath('count', 2);

        foreach ($documents as $document) {
            $this->assertSoftDeleted($document);
        }

        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'bulk_trash',
        ]);
    }

    public function test_share_creates_a_token_and_unshare_revokes_it(): void
    {
        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create(['status' => 'active']);

        $this->actingAs($user);

        $response = $this->postJson('/api/documents/'.$document->id.'/share', [
            'expires_in_days' => 5,
        ]);

        $response->assertOk()
            ->assertJsonPath('document.is_shared', true)
            ->assertJsonPath('document.status', 'shared');

        $document->refresh();

        $this->assertNotNull($document->share_token);
        $this->assertNotNull($document->share_expires_at);
        $this->assertStringContainsString('/share/'.$document->share_token, $response->json('document.share_url'));

        $this->deleteJson('/api/documents/'.$document->id.'/share')
            ->assertOk()
            ->assertJsonPath('document.is_shared', false);

        $this->assertNull($document->fresh()->share_token);
    }

    public function test_verify_marks_the_document_as_verified(): void
    {
        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create(['status' => 'active']);

        $this->actingAs($user);

        $this->postJson('/api/documents/'.$document->id.'/verify')
            ->assertOk()
            ->assertJsonPath('document.status', 'verified');

        $document->refresh();

        $this->assertSame('verified', $document->status);
        $this->assertNotNull($document->verified_at);
    }

    public function test_verify_all_verifies_only_certificates_that_are_not_verified(): void
    {
        $user = User::factory()->create();
        Document::factory()->for($user)->count(2)->create([
            'category' => 'certificate',
            'status' => 'active',
        ]);
        Document::factory()->for($user)->certificate()->create([
            'category' => 'certificate',
        ]);
        Document::factory()->for($user)->create([
            'category' => 'personal',
            'status' => 'active',
        ]);

        $this->actingAs($user);

        $this->postJson('/api/documents/verify-all')
            ->assertOk()
            ->assertJsonPath('count', 2);

        $this->assertSame(3, $user->documents()->where('status', 'verified')->count());
    }

    public function test_file_and_download_responses_stream_the_stored_file(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create([
            'file_path' => 'documents/'.$user->id.'/report.pdf',
            'original_name' => 'report.pdf',
            'mime_type' => 'application/pdf',
        ]);
        Storage::disk('local')->put($document->file_path, 'stored file body');

        $this->actingAs($user);

        $this->get('/api/documents/'.$document->id.'/file')
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->get('/api/documents/'.$document->id.'/download')
            ->assertOk()
            ->assertDownload('report.pdf');

        $this->assertSame(2, $document->fresh()->view_count);
    }

    public function test_file_returns_404_when_the_stored_file_is_missing(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create([
            'file_path' => 'documents/'.$user->id.'/missing.pdf',
        ]);

        $this->actingAs($user);

        $this->getJson('/api/documents/'.$document->id.'/file')
            ->assertNotFound()
            ->assertJsonPath('message', 'The stored file could not be found.');
    }

    public function test_share_token_is_not_exposed_in_document_responses(): void
    {
        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create([
            'share_token' => Str::random(48),
            'share_expires_at' => now()->addDay(),
        ]);

        $this->actingAs($user);

        $this->getJson('/api/documents/'.$document->id)
            ->assertOk()
            ->assertJsonMissingPath('data.share_token')
            ->assertJsonPath('data.is_shared', true);
    }
}
