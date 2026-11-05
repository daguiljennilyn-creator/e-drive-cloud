<?php

namespace Tests\Feature\Api;

use App\Models\Plan;
use App\Models\User;
use App\Services\Notifier;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_returns_401_when_me_is_requested_without_a_session(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_login_authenticates_a_session_for_valid_credentials(): void
    {
        $user = User::factory()->create(['email' => 'alex@example.com']);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'alex@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.email', 'alex@example.com')
            ->assertJsonStructure(['user' => ['id', 'name', 'email', 'storage_used_bytes']])
            ->assertJsonMissingPath('token');

        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'login',
        ]);
    }

    public function test_login_rejects_an_invalid_password_with_422(): void
    {
        User::factory()->create(['email' => 'alex@example.com']);

        $this->postJson('/api/auth/login', [
            'email' => 'alex@example.com',
            'password' => 'WrongPassword1!',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email' => 'The provided credentials do not match our records.',
            ]);

        $this->assertGuest();
    }

    public function test_register_creates_the_user_on_the_free_plan_with_a_welcome_notification(): void
    {
        $plan = Plan::factory()->free()->create();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Alex Morgan',
            'email' => 'alex@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.name', 'Alex Morgan')
            ->assertJsonPath('user.plan.id', $plan->id)
            ->assertJsonStructure(['user' => ['id', 'name', 'email']])
            ->assertJsonMissingPath('token');

        $user = User::where('email', 'alex@example.com')->firstOrFail();

        $this->assertAuthenticatedAs($user);

        $this->assertSame($plan->id, $user->plan_id);
        $this->assertSame($plan->storage_bytes, $user->storage_limit_bytes);
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $user->id,
            'notifiable_type' => User::class,
        ]);
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'account_created',
        ]);
    }

    public function test_register_rejects_an_email_that_is_already_taken(): void
    {
        User::factory()->create(['email' => 'alex@example.com']);

        $this->postJson('/api/auth/register', [
            'name' => 'Alex Morgan',
            'email' => 'alex@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_register_rejects_an_empty_payload(): void
    {
        $this->postJson('/api/auth/register', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_me_returns_the_user_and_unread_notification_count(): void
    {
        $user = User::factory()->create();
        Notifier::send($user, 'welcome', 'Welcome', 'Your vault is ready.');

        $this->actingAs($user);

        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('unread_notifications', 1);
    }

    public function test_logout_ends_the_current_session(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'You have been signed out.');

        $this->assertGuest();
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'action' => 'logout',
        ]);
    }

    public function test_forgot_password_stores_a_reset_token_and_returns_a_generic_message(): void
    {
        $user = User::factory()->create(['email' => 'alex@example.com']);

        $this->postJson('/api/auth/forgot-password', ['email' => 'alex@example.com'])
            ->assertOk()
            ->assertJsonPath('message', 'If an account exists for that email, a password reset link has been sent.');

        $this->assertDatabaseHas('password_reset_tokens', ['email' => $user->email]);
    }

    public function test_reset_password_updates_the_password_and_ends_existing_sessions(): void
    {
        config(['session.driver' => 'database']);

        $user = User::factory()->create(['email' => 'alex@example.com']);
        DB::table('sessions')->insert([
            'id' => 'existing-session',
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
            'payload' => base64_encode(serialize([])),
            'last_activity' => now()->getTimestamp(),
        ]);
        $token = Password::createToken($user);

        $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => 'alex@example.com',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertOk();

        $this->assertTrue(Hash::check('NewPassword123!', $user->fresh()->password));
        $this->assertDatabaseMissing('sessions', ['id' => 'existing-session']);
    }

    public function test_reset_password_rejects_an_invalid_token(): void
    {
        User::factory()->create(['email' => 'alex@example.com']);

        $this->postJson('/api/auth/reset-password', [
            'token' => 'invalid-token',
            'email' => 'alex@example.com',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }
}
