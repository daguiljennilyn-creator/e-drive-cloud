<?php

namespace Tests\Feature\Api;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class ActivityControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_index_returns_only_the_authenticated_users_activity(): void
    {
        $user = User::factory()->create();
        Activity::factory()->for($user)->create([
            'action' => 'login',
            'description' => 'Signed in to E-Drive Cloud',
        ]);
        Activity::factory()->for($user)->create([
            'action' => 'uploaded',
            'description' => 'Uploaded Passport',
        ]);
        Activity::factory()->for(User::factory())->create([
            'action' => 'login',
            'description' => 'Someone else signed in',
        ]);

        $this->actingAs($user);

        $this->getJson('/api/activity')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2);
    }

    public function test_index_filters_by_group_and_search_term(): void
    {
        $user = User::factory()->create();
        Activity::factory()->for($user)->create([
            'action' => 'login',
            'description' => 'Signed in to E-Drive Cloud',
        ]);
        Activity::factory()->for($user)->create([
            'action' => 'uploaded',
            'description' => 'Uploaded Passport',
        ]);
        Activity::factory()->for($user)->create([
            'action' => 'shared',
            'description' => 'Shared Passport with a link',
        ]);

        $this->actingAs($user);

        $this->getJson('/api/activity?group=security')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.action', 'login');

        $this->getJson('/api/activity?group=sharing')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.action', 'shared');

        $this->getJson('/api/activity?q=Passport')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->getJson('/api/activity?action=uploaded')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.description', 'Uploaded Passport');
    }
}
