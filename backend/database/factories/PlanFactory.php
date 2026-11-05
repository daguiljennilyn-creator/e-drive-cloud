<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $storage = fake()->randomElement([16106127360, 107374182400, 1099511627776]);

        return [
            'name' => fake()->unique()->word().' Plan',
            'slug' => fake()->unique()->slug(),
            'price_cents' => fake()->randomElement([0, 999, 2499]),
            'billing_period' => 'month',
            'storage_bytes' => $storage,
            'features' => ['Encrypted vault', 'Expiry reminders'],
            'is_active' => true,
            'sort_order' => fake()->numberBetween(0, 10),
        ];
    }

    public function free(): static
    {
        return $this->state(fn () => [
            'name' => 'Starter',
            'slug' => 'free',
            'price_cents' => 0,
            'storage_bytes' => 16106127360,
            'sort_order' => 1,
        ]);
    }

    public function pro(): static
    {
        return $this->state(fn () => [
            'name' => 'Professional',
            'slug' => 'pro',
            'price_cents' => 999,
            'storage_bytes' => 107374182400,
            'sort_order' => 2,
        ]);
    }
}
