<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'open_time',
        'close_time',
        'regular_holidays',
        'terms_text',
        // 予約締切ルール関連のカラム
        'booking_deadline_type',
        'booking_deadline_hours',
        'booking_deadline_days',
        'booking_deadline_time',
    ];

    protected function casts(): array
    {
        return [
            // DBのJSON文字列を、PHPの配列(array)に自動変換する
            'regular_holidays' => 'array', 
        ];
    }
}