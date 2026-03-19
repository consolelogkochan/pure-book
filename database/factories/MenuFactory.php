<?php

namespace Database\Factories;

use App\Models\Menu;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Menu>
 */
class MenuFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['カット', 'カラー', 'パーマ', 'トリートメント', 'ヘッドスパ']),
            // 所要時間は30分、60分、90分、120分の中からランダム
            'duration_minutes' => fake()->randomElement([30, 60, 90, 120]),
            // 料金は 3000 〜 15000 の間（100円単位）
            'price' => fake()->numberBetween(30, 150) * 100,
            'thumbnail_url' => null,
            'catchphrase' => fake()->realText(20), // 20文字程度の適当な日本語
            'description' => fake()->realText(50), // 50文字程度の適当な日本語
            'is_active' => true,
        ];
    }
}
