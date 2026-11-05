<?php

namespace Database\Factories;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Activity>
 */
class ActivityFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'document_id' => null,
            'action' => fake()->randomElement(['login', 'uploaded', 'updated', 'shared', 'restored']),
            'description' => fake()->sentence(),
            'metadata' => [],
            'ip_address' => fake()->ipv4(),
        ];
    }
}
