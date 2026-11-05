<?php

namespace Tests\Feature\Api;

use App\Models\Device;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class SettingsControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_index_returns_the_user_plans_and_device_count(): void
    {
        $plan = Plan::factory()->free()->create();
        $user = User::factory()->create(['plan_id' => $plan->id]);
        Device::factory()->for($user)->count(2)->create();

        $this->actingAs($user);

        $this->getJson('/api/settings')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.plan.id', $plan->id)
            ->assertJsonPath('devices_count', 2)
            ->assertJsonCount(1, 'plans');
    }

    public function test_update_security_persists_every_setting(): void
    {
        $user = User::factory()->create([
            'two_factor_enabled' => false,
            'biometric_enabled' => false,
            'auto_lock_enabled' => false,
            'auto_lock_minutes' => 5,
            'login_alerts_enabled' => false,
        ]);

        $this->actingAs($user);

        $this->putJson('/api/settings/security', [
            'two_factor_enabled' => true,
            'biometric_enabled' => true,
            'auto_lock_enabled' => true,
            'auto_lock_minutes' => 15,
            'login_alerts_enabled' => true,
        ])->assertOk()
            ->assertJsonPath('user.two_factor_enabled', true)
            ->assertJsonPath('user.auto_lock_minutes', 15);

        $user->refresh();

        $this->assertTrue($user->two_factor_enabled);
        $this->assertTrue($user->biometric_enabled);
        $this->assertTrue($user->auto_lock_enabled);
        $this->assertSame(15, $user->auto_lock_minutes);
        $this->assertTrue($user->login_alerts_enabled);
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'security_updated',
        ]);
    }

    public function test_update_security_rejects_an_out_of_range_auto_lock_timeout(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->putJson('/api/settings/security', [
            'auto_lock_minutes' => 61,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('auto_lock_minutes');
    }

    public function test_update_notifications_merges_the_defaults(): void
    {
        $user = User::factory()->create(['notification_preferences' => null]);
        $this->actingAs($user);

        $this->putJson('/api/settings/notifications', [
            'security_alerts' => false,
            'weekly_digest' => true,
        ])->assertOk()
            ->assertJsonPath('notification_preferences.security_alerts', false)
            ->assertJsonPath('notification_preferences.weekly_digest', true)
            ->assertJsonPath('notification_preferences.expiry_reminders', true);

        $user->refresh();

        $this->assertFalse($user->notificationPreferences()['security_alerts']);
        $this->assertTrue($user->notificationPreferences()['expiry_reminders']);
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'notifications_updated',
        ]);
    }

    public function test_update_privacy_merges_the_defaults(): void
    {
        $user = User::factory()->create(['privacy_preferences' => null]);
        $this->actingAs($user);

        $this->putJson('/api/settings/privacy', [
            'analytics' => true,
            'profile_visible' => false,
        ])->assertOk()
            ->assertJsonPath('privacy_preferences.analytics', true)
            ->assertJsonPath('privacy_preferences.profile_visible', false)
            ->assertJsonPath('privacy_preferences.personalized_tips', true);

        $this->assertTrue($user->fresh()->privacyPreferences()['analytics']);
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'privacy_updated',
        ]);
    }

    public function test_devices_are_listed_with_the_current_device_first(): void
    {
        $user = User::factory()->create();
        Device::factory()->for($user)->create([
            'name' => 'Old laptop',
            'is_current' => false,
            'last_active_at' => now()->subDays(5),
        ]);
        Device::factory()->for($user)->create([
            'name' => 'Current laptop',
            'is_current' => true,
            'last_active_at' => now()->subDay(),
        ]);

        $this->actingAs($user);

        $this->getJson('/api/devices')
            ->assertOk()
            ->assertJsonCount(2, 'devices')
            ->assertJsonPath('devices.0.name', 'Current laptop')
            ->assertJsonPath('devices.0.is_current', true);
    }

    public function test_current_device_cannot_be_revoked(): void
    {
        $user = User::factory()->create();
        $device = Device::factory()->for($user)->create(['is_current' => true]);

        $this->actingAs($user);

        $this->deleteJson('/api/devices/'.$device->id)
            ->assertUnprocessable()
            ->assertJsonPath('message', 'You cannot revoke the device you are currently using.');

        $this->assertDatabaseHas('devices', ['id' => $device->id]);
    }

    public function test_revoke_device_deletes_another_users_device_only_after_matching_the_owner(): void
    {
        $user = User::factory()->create();
        $device = Device::factory()->for($user)->create(['is_current' => false]);
        $otherDevice = Device::factory()->for(User::factory())->create();

        $this->actingAs($user);

        $this->deleteJson('/api/devices/'.$device->id)->assertOk();
        $this->assertDatabaseMissing('devices', ['id' => $device->id]);

        $this->deleteJson('/api/devices/'.$otherDevice->id)->assertNotFound();
        $this->assertDatabaseHas('devices', ['id' => $otherDevice->id]);
    }

    public function test_revoke_other_devices_keeps_the_current_device(): void
    {
        $user = User::factory()->create();
        $current = Device::factory()->for($user)->create(['is_current' => true]);
        Device::factory()->for($user)->count(2)->create(['is_current' => false]);

        $this->actingAs($user);

        $this->deleteJson('/api/devices')
            ->assertOk()
            ->assertJsonPath('count', 2);

        $this->assertDatabaseCount('devices', 1);
        $this->assertDatabaseHas('devices', ['id' => $current->id]);
    }
}
