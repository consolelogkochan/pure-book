<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Menu;
use App\Models\Staff; // 👈 追加（重要）
use App\Models\Setting; // 👈 追加（店舗設定モデル）
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AvailableSlotController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // 1. 送られてきたデータを検証（バリデーション）
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'], // 例: "2026-03-20" の形式か
            'menu_id' => ['required', 'integer', 'exists:menus,id'], // 存在するメニューIDか
        ]);

        // 2. 準備（Carbonインスタンスの作成とメニューの取得）
        $targetDate = Carbon::parse($validated['date']);
        $menu = Menu::findOrFail($validated['menu_id']);

        // 3. ターゲット日の「曜日（英語小文字）」を取得（例: 'monday'）
        $dayOfWeek = strtolower($targetDate->englishDayOfWeek);

        // 4. 店舗設定の取得
        // 万が一、管理者が一度も設定画面を開いていない場合のエラーを防ぐため、ここでも firstOrCreate を使います
        $settings = Setting::firstOrCreate(
            ['id' => 1],
            [
                'open_time' => '10:00:00',
                'close_time' => '20:00:00',
                'regular_holidays' => [],
                'booking_deadline_type' => 'time_based',
                'booking_deadline_hours' => 2,
                'booking_deadline_days' => 1,
                'booking_deadline_time' => '17:00:00',
            ]
        );

        // 5. 店舗の定休日チェック（動的判定）
        // $settings->regular_holidays の配列の中に、ターゲットの曜日が含まれているかチェック
        $regularHolidays = $settings->regular_holidays ?? [];
        if (in_array($dayOfWeek, $regularHolidays)) {
            return response()->json([]); // 定休日は空っぽを返す
        }

        // 6. その曜日に出勤しているスタッフの総数を取得（シフト連動）
        // 単なる is_active だけでなく、該当曜日のシフトが true のスタッフだけを数えます
        $availableStaffCount = Staff::where('is_active', true)
            ->whereHas('schedule', function ($q) use ($dayOfWeek) {
                $q->where($dayOfWeek, true);
            })
            ->count();

        if ($availableStaffCount === 0) {
            return response()->json([]); // その日出勤するスタッフが0人なら予約不可
        }

        $now = Carbon::now();
        $isTimeBased = $settings->booking_deadline_type === 'time_based';

        // 7.（日付ベース）の場合の【早期リターン】
        if (! $isTimeBased) {
            // 例：「1日前」の「17:00」という Carbonインスタンス（期限）を作る
            $deadlineDays = $settings->booking_deadline_days ?? 1;
            $deadlineTime = $settings->booking_deadline_time ?? '17:00:00';
            
            $bookingDeadline = $targetDate->copy()
                ->subDays($deadlineDays)
                ->setTimeFromTimeString($deadlineTime);
            
            // 「現在時刻」が「予約期限」を過ぎていたら、DB検索やループをやらずに空っぽを返す！
            if ($now > $bookingDeadline) {
                return response()->json([]);
            }
        }

        // 8.指定された日付の「すべての予約」をあらかじめ取得しておく（N+1問題対策）
        $bookingsOnDate = Booking::whereDate('start_time', $targetDate->format('Y-m-d'))
            // キャンセルされた予約は計算から除外する
            ->where('status', '!=', 'cancelled')
            ->get();

        // 9. 営業時間のセット（動的判定）
        // DBから取得した "10:00:00" などの文字列を、ターゲット日の時間としてセットします
        $openTime = $targetDate->copy()->setTimeFromTimeString($settings->open_time);
        $closeTime = $targetDate->copy()->setTimeFromTimeString($settings->close_time);

        $availableSlots = [];
        $currentTime = $openTime->copy();

        // 10. 10:00から20:00まで、30分刻みでループを回す
        while ($currentTime < $closeTime) {
            // その枠で予約した場合の「終了予定時刻」を計算
            $endTime = $currentTime->copy()->addMinutes($menu->duration_minutes);


            // 条件A: 終了予定時刻が、営業終了を超えていないか？
            if ($endTime <= $closeTime) {
                
                $isValidSlot = false;

                // ▼追加：パターンA（時間ベース）のチェック▼
                if ($isTimeBased) {
                    $deadlineHours = $settings->booking_deadline_hours ?? 2;
                    // その枠の開始時間から〇時間前を「期限」とする
                    $slotDeadline = $currentTime->copy()->subHours($deadlineHours);
                    // 「現在時刻」が「期限」より前（または同時）ならOK
                    $isValidSlot = $now <= $slotDeadline;
                } else {
                    // パターンB（日付ベース）の場合は、ループに入る前にすでに期限チェックをパスしているので常にtrue
                    $isValidSlot = true;
                }

                // 期限チェックをクリアした枠のみ、重複予約のチェックに進む
                if ($isValidSlot) {
                    $overlappingBookings = $bookingsOnDate->filter(function ($booking) use ($currentTime, $endTime) {
                        return $booking->start_time < $endTime && $booking->end_time > $currentTime;
                    })->count();

                    if ($overlappingBookings < $availableStaffCount) {
                        $availableSlots[] = $currentTime->format('H:i');
                    }
                }
            }

            // 次の30分枠へ進める（10:00 -> 10:30）
            $currentTime->addMinutes(30);
        }

        // 生成された時間枠の配列をJSONで返す
        return response()->json($availableSlots);
    }
}
