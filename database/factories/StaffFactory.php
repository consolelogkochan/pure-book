<?php

namespace Database\Factories;

use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Staff>
 */
class StaffFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // fake() を使うと、ランダムな日本語の名前などを自動生成してくれます
            'name' => fake()->name(),
            'is_active' => true,
        ];
    }
}
