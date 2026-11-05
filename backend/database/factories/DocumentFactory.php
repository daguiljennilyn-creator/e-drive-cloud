<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Document>
 */
class DocumentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = ['government_id', 'certificate', 'personal', 'school', 'employment', 'financial', 'health', 'other'];
        $category = fake()->randomElement($categories);

        return [
            'user_id' => User::factory(),
            'name' => fake()->words(3, true),
            'original_name' => fake()->word().'.pdf',
            'file_path' => 'documents/demo/'.fake()->uuid().'.pdf',
            'mime_type' => 'application/pdf',
            'extension' => 'pdf',
            'size' => fake()->numberBetween(200000, 5000000),
            'category' => $category,
            'description' => fake()->sentence(),
            'tags' => fake()->randomElements(['identity', 'tax', 'travel', 'work'], 2),
            'status' => fake()->randomElement(['active', 'verified', 'shared']),
            'issued_at' => fake()->dateTimeBetween('-5 years')->format('Y-m-d'),
            'expires_at' => fake()->optional()->dateTimeBetween('now', '+5 years')?->format('Y-m-d'),
            'last_modified_at' => now(),
            'checksum' => hash('sha256', fake()->uuid()),
        ];
    }

    public function certificate(): static
    {
        return $this->state(fn () => [
            'category' => 'certificate',
            'status' => 'verified',
            'verified_at' => now(),
        ]);
    }

    public function deleted(): static
    {
        return $this->state(fn () => ['deleted_at' => now()]);
    }
}
