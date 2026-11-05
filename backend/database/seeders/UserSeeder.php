<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $plan = Plan::where('slug', 'free')->first();

        $user = User::updateOrCreate(
            ['email' => config('edrive.demo_user.email')],
            [
                'name' => 'Sarah Jenkins',
                'password' => config('edrive.demo_user.password'),
                'email_verified_at' => now(),
                'role' => 'owner',
                'phone' => '+1 (415) 555-0142',
                'job_title' => 'Director of Operations',
                'company' => 'Northstar Labs',
                'bio' => 'Operations leader keeping family, finance and work documents organised in one encrypted vault.',
                'plan_id' => $plan?->id,
                'storage_limit_bytes' => $plan?->storage_bytes ?? 16106127360,
                'two_factor_enabled' => true,
                'biometric_enabled' => true,
                'auto_lock_enabled' => true,
                'auto_lock_minutes' => 2,
                'login_alerts_enabled' => true,
                'notification_preferences' => [
                    'expiry_reminders' => true,
                    'security_alerts' => true,
                    'sharing_activity' => true,
                    'storage_alerts' => true,
                    'weekly_digest' => true,
                    'product_updates' => false,
                ],
                'privacy_preferences' => [
                    'profile_visible' => true,
                    'activity_logging' => true,
                    'analytics' => false,
                    'personalized_tips' => true,
                ],
                'last_active_at' => now(),
            ],
        );

        $user->forceFill([
            'created_at' => now()->subYears(2)->subMonths(3),
        ])->saveQuietly();
    }
}
