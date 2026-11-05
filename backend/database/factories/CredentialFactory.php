<?php

namespace Database\Factories;

use App\Models\Credential;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Credential>
 */
class CredentialFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->company(),
            'type' => fake()->randomElement(Credential::TYPES),
            'identifier' => fake()->userName().'@example.com',
            'secret' => fake()->password(16),
            'url' => fake()->url(),
            'notes' => fake()->sentence(),
            'health' => fake()->randomElement(['strong', 'fair', 'weak']),
            'two_factor_enabled' => fake()->boolean(70),
            'is_favorite' => fake()->boolean(20),
            'last_rotated_at' => fake()->dateTimeBetween('-90 days'),
            'expires_at' => fake()->optional()->dateTimeBetween('now', '+2 years')?->format('Y-m-d'),
        ];
    }
}
