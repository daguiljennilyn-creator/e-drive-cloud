<?php

namespace Database\Factories;

use App\Models\Device;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Device>
 */
class DeviceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->randomElement(['MacBook Pro', 'Dell XPS 15', 'iPhone 15 Pro', 'iPad Air']),
            'type' => fake()->randomElement(['desktop', 'laptop', 'mobile', 'tablet']),
            'os' => fake()->randomElement(['Windows 11', 'macOS Sonoma', 'iOS 18', 'Android 15']),
            'browser' => fake()->randomElement(['Chrome 131', 'Safari 18', 'Firefox 133', 'Edge 131']),
            'location' => fake()->city().', '.fake()->country(),
            'ip_address' => fake()->ipv4(),
            'is_current' => fake()->boolean(20),
            'last_active_at' => fake()->dateTimeBetween('-10 days'),
        ];
    }
}
