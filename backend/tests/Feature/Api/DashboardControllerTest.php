<?php

namespace Tests\Feature\Api;

use App\Models\Activity;
use App\Models\Credential;
use App\Models\Document;
use App\Models\User;
use App\Services\Notifier;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_returns_401_when_the_dashboard_is_requested_without_a_token(): void
    {
        $this->getJson('/api/dashboard')->assertUnauthorized();
    }

    public function test_returns_document_statistics_storage_and_security_score(): void
    {
        $user = User::factory()->create([
            'two_factor_enabled' => true,
            'biometric_enabled' => true,
            'auto_lock_enabled' => true,
            'login_alerts_enabled' => true,
        ]);

        Document::factory()->for($user)->create([
            'name' => 'Passport',
            'category' => 'government_id',
            'size' => 100,
        ]);
        Document::factory()->for($user)->create([
            'name' => 'Certificate',
            'category' => 'certificate',
            'size' => 200,
            'is_favorite' => true,
        ]);
        Document::factory()->for($user)->create([
            'name' => 'Lease',
            'category' => 'personal',
            'size' => 50,
            'expires_at' => now()->addDays(5),
        ]);
        Credential::factory()->for($user)->create(['health' => 'strong']);
        Activity::factory()->for($user)->create(['action' => 'login']);
        Notifier::send($user, 'welcome', 'Welcome', 'Ready.');

        $this->actingAs($user);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.total_documents', 3)
            ->assertJsonPath('stats.certificates', 1)
            ->assertJsonPath('stats.personal_files', 1)
            ->assertJsonPath('stats.credentials', 1)
            ->assertJsonPath('stats.credentials_strong', 1)
            ->assertJsonPath('stats.credentials_need_rotation', 0)
            ->assertJsonPath('stats.favorites', 1)
            ->assertJsonPath('stats.expiring', 1)
            ->assertJsonPath('stats.shared', 0)
            ->assertJsonPath('storage.used_bytes', 350)
            ->assertJsonPath('storage.limit_bytes', 16106127360)
            ->assertJsonPath('security.score', 100)
            ->assertJsonPath('security.label', 'Excellent')
            ->assertJsonPath('unread_notifications', 1)
            ->assertJsonCount(3, 'recent_documents')
            ->assertJsonCount(1, 'recent_activity')
            ->assertJsonCount(1, 'expiring_documents');
    }

    public function test_security_score_reflects_disabled_protections(): void
    {
        $user = User::factory()->create([
            'two_factor_enabled' => false,
            'biometric_enabled' => false,
            'auto_lock_enabled' => true,
            'login_alerts_enabled' => true,
        ]);

        $this->actingAs($user);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('security.score', 75)
            ->assertJsonPath('security.label', 'Strong')
            ->assertJsonPath('security.two_factor_enabled', false)
            ->assertJsonCount(2, 'security.recommendations');
    }

    public function test_storage_breakdown_groups_documents_by_category(): void
    {
        $user = User::factory()->create();
        Document::factory()->for($user)->create([
            'category' => 'government_id',
            'size' => 100,
        ]);
        Document::factory()->for($user)->create([
            'category' => 'certificate',
            'size' => 300,
        ]);

        $this->actingAs($user);

        $response = $this->getJson('/api/dashboard');

        $response->assertOk()
            ->assertJsonCount(2, 'storage.breakdown')
            ->assertJsonPath('storage.breakdown.0.category', 'certificate')
            ->assertJsonPath('storage.breakdown.0.bytes', 300)
            ->assertJsonPath('storage.breakdown.0.label', 'Certificates');
    }
}
