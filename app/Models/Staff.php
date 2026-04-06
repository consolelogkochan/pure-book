<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Staff extends Model
{
    use HasFactory;

    // 修正後
    protected $fillable = ['name', 'role', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    // スタッフは複数の予約を担当する（1対多）
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    // スタッフは1つのスケジュールを持つ（1対1）
    public function schedule(): HasOne
    {
        return $this->hasOne(StaffSchedule::class);
    }
}
