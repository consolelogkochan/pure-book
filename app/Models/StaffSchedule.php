<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'staff_id', 'monday', 'tuesday', 'wednesday', 
        'thursday', 'friday', 'saturday', 'sunday'
    ];

    protected function casts(): array
    {
        return [
            'monday' => 'boolean', 'tuesday' => 'boolean', 'wednesday' => 'boolean',
            'thursday' => 'boolean', 'friday' => 'boolean', 'saturday' => 'boolean', 'sunday' => 'boolean',
        ];
    }

    // スケジュールは1人のスタッフに属する（逆向きのリレーション）
    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }
}