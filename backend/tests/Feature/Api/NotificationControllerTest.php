<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Services\Notifier;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class NotificationControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_index_returns_only_the_authenticated_users_notifications(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        Notifier::send($user, 'welcome', 'Welcome', 'Your vault is ready.');
        Notifier::send($other, 'welcome', 'Other user', 'Not yours.');

        $this->actingAs($user);

        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.unread_count', 1)
            ->assertJsonPath('data.0.title', 'Welcome');
    }

    public function test_index_filters_unread_notifications(): void
    {
        $user = User::factory()->create();
        Notifier::send($user, 'welcome', 'Welcome', 'Ready.');

        $notification = $user->notifications()->firstOrFail();
        $notification->markAsRead();

        Notifier::send($user, 'security', 'New sign-in', 'A new device signed in.');

        $this->actingAs($user);

        $this->getJson('/api/notifications?filter=unread')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'New sign-in')
            ->assertJsonPath('meta.unread_count', 1);
    }

    public function test_index_filters_notifications_by_category(): void
    {
        $user = User::factory()->create();
        Notifier::send($user, 'expiry', 'Passport expiring', 'Renew your passport.');
        Notifier::send($user, 'security', 'New sign-in', 'Review the device.');
        Notifier::send($user, 'welcome', 'Welcome', 'Ready.');

        $this->actingAs($user);

        $this->getJson('/api/notifications?category=documents')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'expiry');

        $this->getJson('/api/notifications?category=security')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'security');
    }

    public function test_mark_read_marks_a_single_notification_as_read(): void
    {
        $user = User::factory()->create();
        Notifier::send($user, 'welcome', 'Welcome', 'Ready.');

        $notification = $user->notifications()->firstOrFail();

        $this->actingAs($user);

        $this->postJson('/api/notifications/'.$notification->id.'/read')
            ->assertOk()
            ->assertJsonPath('notification.is_read', true)
            ->assertJsonPath('unread_count', 0);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_mark_all_read_clears_the_unread_count(): void
    {
        $user = User::factory()->create();
        Notifier::send($user, 'welcome', 'Welcome', 'Ready.');
        Notifier::send($user, 'security', 'New sign-in', 'Review the device.');

        $this->actingAs($user);

        $this->postJson('/api/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('unread_count', 0);

        $this->assertSame(0, $user->unreadNotifications()->count());
        $this->assertSame(2, $user->notifications()->whereNotNull('read_at')->count());
    }

    public function test_destroy_deletes_a_single_notification(): void
    {
        $user = User::factory()->create();
        Notifier::send($user, 'welcome', 'Welcome', 'Ready.');

        $notification = $user->notifications()->firstOrFail();

        $this->actingAs($user);

        $this->deleteJson('/api/notifications/'.$notification->id)
            ->assertOk()
            ->assertJsonPath('message', 'Notification deleted.');

        $this->assertDatabaseMissing('notifications', ['id' => $notification->id]);
    }

    public function test_clear_read_deletes_only_read_notifications(): void
    {
        $user = User::factory()->create();
        Notifier::send($user, 'welcome', 'Welcome', 'Ready.');
        Notifier::send($user, 'security', 'New sign-in', 'Review the device.');

        $read = $user->notifications()->firstOrFail();
        $read->markAsRead();

        $this->actingAs($user);

        $this->deleteJson('/api/notifications/read')
            ->assertOk()
            ->assertJsonPath('count', 1);

        $this->assertDatabaseMissing('notifications', ['id' => $read->id]);
        $this->assertSame(1, $user->notifications()->count());
    }

    public function test_another_users_notification_returns_404_when_marked_read(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        Notifier::send($other, 'welcome', 'Welcome', 'Ready.');

        $notification = $other->notifications()->firstOrFail();

        $this->actingAs($user);

        $this->postJson('/api/notifications/'.$notification->id.'/read')
            ->assertNotFound();

        $this->assertNull($notification->fresh()->read_at);
    }
}
