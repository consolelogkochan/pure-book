<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_reference', 'user_id', 'staff_id', 'menu_id',
        'start_time', 'end_time', 'customer_name', 'customer_email',
        'customer_phone', 'customer_memo', 'survey_responses', 'status',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'survey_responses' => 'array', // JSONを自動でPHPの配列に変換
        ];
    }

    // 予約は1人のユーザーに属する（ゲスト予約の場合はnullになる）
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // 予約は1人のスタッフに属する
    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    // 予約は1つのメニューに属する
    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }
}
