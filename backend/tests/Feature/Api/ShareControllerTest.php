<?php

namespace Tests\Feature\Api;

use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ShareControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_public_share_returns_document_metadata_and_increments_views(): void
    {
        $user = User::factory()->create(['name' => 'Sarah Jenkins']);
        $document = Document::factory()->for($user)->create([
            'name' => 'Passport',
            'original_name' => 'passport.pdf',
            'size' => 2516582,
            'share_token' => 'public-token',
            'share_expires_at' => now()->addDays(7),
            'shared_at' => now(),
        ]);

        $response = $this->getJson('/api/share/public-token');

        $response->assertOk()
            ->assertJsonPath('document.name', 'Passport')
            ->assertJsonPath('document.owner', 'Sarah Jenkins')
            ->assertJsonPath('document.human_size', '2.4 MB')
            ->assertJsonPath('document.download_url', route('share.download', ['token' => 'public-token']));

        $document->refresh();

        $this->assertSame(1, $document->view_count);
        $this->assertNotNull($document->last_accessed_at);
    }

    public function test_unknown_share_token_returns_404(): void
    {
        $this->getJson('/api/share/not-a-real-token')
            ->assertNotFound()
            ->assertJsonPath('message', 'This share link is invalid or has been revoked.');
    }

    public function test_expired_share_token_returns_410(): void
    {
        Document::factory()->for(User::factory())->create([
            'share_token' => 'expired-token',
            'share_expires_at' => now()->subMinute(),
        ]);

        $this->getJson('/api/share/expired-token')
            ->assertStatus(410)
            ->assertJsonPath('message', 'This share link has expired.');
    }

    public function test_trashed_document_share_token_returns_404(): void
    {
        Document::factory()->for(User::factory())->deleted()->create([
            'share_token' => 'trashed-token',
            'share_expires_at' => now()->addDay(),
        ]);

        $this->getJson('/api/share/trashed-token')->assertNotFound();
    }

    public function test_shared_file_can_be_previewed_and_downloaded(): void
    {
        Storage::fake('local');

        $document = Document::factory()->for(User::factory())->create([
            'share_token' => 'file-token',
            'share_expires_at' => now()->addDay(),
            'file_path' => 'documents/shared/report.pdf',
            'original_name' => 'report.pdf',
            'mime_type' => 'application/pdf',
        ]);
        Storage::disk('local')->put($document->file_path, 'shared file body');

        $this->get('/api/share/file-token/file')
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->get('/api/share/file-token/download')
            ->assertOk()
            ->assertDownload('report.pdf');

        $this->assertSame(2, $document->fresh()->view_count);
    }

    public function test_missing_shared_file_returns_404(): void
    {
        Storage::fake('local');

        Document::factory()->for(User::factory())->create([
            'share_token' => 'missing-file-token',
            'share_expires_at' => now()->addDay(),
            'file_path' => 'documents/shared/missing.pdf',
        ]);

        $this->getJson('/api/share/missing-file-token/file')
            ->assertNotFound()
            ->assertJsonPath('message', 'The shared file is no longer available.');
    }

    public function test_expired_share_token_returns_410_for_files(): void
    {
        Document::factory()->for(User::factory())->create([
            'share_token' => 'expired-file-token',
            'share_expires_at' => now()->subMinute(),
            'file_path' => 'documents/shared/expired.pdf',
        ]);

        $this->getJson('/api/share/expired-file-token/download')->assertStatus(410);
    }
}
