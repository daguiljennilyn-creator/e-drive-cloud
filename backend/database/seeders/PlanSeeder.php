<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'free',
                'price_cents' => 0,
                'billing_period' => 'month',
                'storage_bytes' => 16106127360,
                'features' => [
                    '15 GB encrypted storage',
                    'Zero-knowledge vault',
                    'Expiry reminders',
                    'Secure share links',
                    '2 devices',
                ],
                'sort_order' => 1,
            ],
            [
                'name' => 'Professional',
                'slug' => 'pro',
                'price_cents' => 999,
                'billing_period' => 'month',
                'storage_bytes' => 107374182400,
                'features' => [
                    '100 GB encrypted storage',
                    'Advanced expiry monitor',
                    'Unlimited share links',
                    'Priority support',
                    '10 devices',
                ],
                'sort_order' => 2,
            ],
            [
                'name' => 'Business',
                'slug' => 'business',
                'price_cents' => 2499,
                'billing_period' => 'month',
                'storage_bytes' => 1099511627776,
                'features' => [
                    '1 TB encrypted storage',
                    'Team vaults and roles',
                    'Audit log export',
                    'SSO and FIDO2 enforcement',
                    'Unlimited devices',
                ],
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
