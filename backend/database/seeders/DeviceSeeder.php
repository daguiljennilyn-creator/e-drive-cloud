<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DeviceSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', config('edrive.demo_user.email'))->firstOrFail();
        $user->devices()->delete();

        $devices = [
            ['MacBook Pro 16"', 'laptop', 'macOS Sonoma', 'Safari 18', 'San Francisco, US', '192.168.1.24', true, 0],
            ['iPhone 15 Pro', 'mobile', 'iOS 18', 'Safari Mobile', 'San Francisco, US', '172.58.21.90', false, 1],
            ['Office Workstation', 'desktop', 'Windows 11', 'Chrome 131', 'San Jose, US', '10.10.4.18', false, 3],
            ['iPad Air', 'tablet', 'iPadOS 18', 'Safari 18', 'Los Angeles, US', '172.58.44.12', false, 12],
        ];

        foreach ($devices as [$name, $type, $os, $browser, $location, $ip, $isCurrent, $daysAgo]) {
            $user->devices()->create([
                'name' => $name,
                'type' => $type,
                'os' => $os,
                'browser' => $browser,
                'location' => $location,
                'ip_address' => $ip,
                'is_current' => $isCurrent,
                'last_active_at' => now()->subDays($daysAgo)->subHours(2),
            ]);
        }
    }
}
