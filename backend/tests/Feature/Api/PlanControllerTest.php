<?php

namespace Tests\Feature\Api;

use App\Models\Document;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class PlanControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_plans_require_authentication_even_without_a_json_accept_header(): void
    {
        $this->get('/api/plans')
            ->assertUnauthorized()
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_index_returns_active_plans_and_the_current_plan(): void
    {
        $current = Plan::factory()->free()->create();
        $pro = Plan::factory()->pro()->create();
        Plan::factory()->create(['is_active' => false]);

        $user = User::factory()->create([
            'plan_id' => $current->id,
            'storage_limit_bytes' => $current->storage_bytes,
        ]);
        Document::factory()->for($user)->create(['size' => 4096]);

        $this->actingAs($user);

        $this->getJson('/api/plans')
            ->assertOk()
            ->assertJsonCount(2, 'plans')
            ->assertJsonPath('current_plan.id', $current->id)
            ->assertJsonPath('storage_used_bytes', 4096)
            ->assertJsonPath('storage_limit_bytes', $current->storage_bytes);

        $this->assertTrue(
            collect($this->getJson('/api/plans')->json('plans'))->contains('id', $pro->id)
        );
    }

    public function test_upgrade_changes_the_users_plan_and_storage_limit(): void
    {
        $current = Plan::factory()->free()->create();
        $pro = Plan::factory()->pro()->create();

        $user = User::factory()->create([
            'plan_id' => $current->id,
            'storage_limit_bytes' => $current->storage_bytes,
        ]);

        $this->actingAs($user);

        $this->postJson('/api/plans/upgrade', ['plan_id' => $pro->id])
            ->assertOk()
            ->assertJsonPath('user.plan.id', $pro->id)
            ->assertJsonPath('plan.id', $pro->id);

        $user->refresh();

        $this->assertSame($pro->id, $user->plan_id);
        $this->assertSame($pro->storage_bytes, $user->storage_limit_bytes);
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'plan_changed',
        ]);
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $user->id,
            'notifiable_type' => User::class,
        ]);
    }

    public function test_upgrade_rejects_a_plan_too_small_for_the_current_files(): void
    {
        $current = Plan::factory()->free()->create();
        $tiny = Plan::factory()->create(['storage_bytes' => 500]);
        $user = User::factory()->create([
            'plan_id' => $current->id,
            'storage_limit_bytes' => $current->storage_bytes,
        ]);
        Document::factory()->for($user)->create(['size' => 1000]);

        $this->actingAs($user);

        $this->postJson('/api/plans/upgrade', ['plan_id' => $tiny->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'plan_id' => 'This plan does not have enough storage for your current files.',
            ]);

        $this->assertSame($current->id, $user->fresh()->plan_id);
    }

    public function test_upgrade_rejects_an_inactive_plan(): void
    {
        $inactive = Plan::factory()->create(['is_active' => false]);
        $user = User::factory()->create();

        $this->actingAs($user);

        $this->postJson('/api/plans/upgrade', ['plan_id' => $inactive->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('plan_id');

        $this->assertNull($user->fresh()->plan_id);
    }
}
