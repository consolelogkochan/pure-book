<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Menu;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'booking_reference' => 'BKG-'.strtoupper(Str::random(8)),
            'user_id' => null,
            'staff_id' => Staff::factory(),
            'menu_id' => Menu::factory(),
            'start_time' => now()->addDay()->setTime(10, 0),
            'end_time' => now()->addDay()->setTime(11, 0),
            'customer_name' => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'customer_phone' => '090-0000-0000',
            'status' => 'confirmed',
        ];
    }
}
