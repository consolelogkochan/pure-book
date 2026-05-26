<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property Carbon $start_time
 * @property Carbon $end_time
 */
class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_reference', 'user_id', 'staff_id', 'menu_id',
        'start_time', 'end_time', 'customer_name', 'customer_email',
        'customer_phone', 'customer_memo', 'survey_responses', 'status',
        'payment_status', 'stripe_payment_intent_id',
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

    // 検索用のローカルスコープ
    // 💡 when($値, function($q, $値) {}) は「もし$値が存在したら、この条件を追加する」というLaravelの超便利メソッドです
    //  PHPDocと、実際の引数・戻り値に型を追加
    /**
     * @param  array<string, mixed>  $filters
     */
    public function scopeSearchFilter(Builder $query, array $filters): Builder
    {
        $query->when($filters['date'] ?? null, function ($q, $date) {
            $q->whereDate('start_time', $date);
        })->when($filters['name'] ?? null, function ($q, $name) {
            $q->where('customer_name', 'like', '%'.$name.'%');
        })->when($filters['reference'] ?? null, function ($q, $reference) {
            $q->where('booking_reference', 'like', '%'.$reference.'%');
        })->when($filters['menu'] ?? null, function ($q, $menuId) {
            $q->where('menu_id', $menuId);
        })->when($filters['status'] ?? null, function ($q, $status) {
            $q->where('status', $status);
        });

        return $query;
    }
}
