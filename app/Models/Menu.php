<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Menu extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'duration_minutes', 'price', 'thumbnail_url',
        'catchphrase', 'description', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    // メニューは複数の予約に使われる（1対多）
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
