<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        // FullCalendarから自動的に送られてくる期間のパラメーターを取得
        $start = $request->query('start');
        $end = $request->query('end');

        // メニューとスタッフ情報も一緒に取得（N+1問題の回避）
        $query = Booking::with(['menu', 'staff']);

        // 期間指定があれば絞り込む
        if ($start && $end) {
            $query->whereBetween('start_time', [$start, $end]);
        }

        return response()->json($query->get());
    }

    public function update(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);

        // 送られてきたデータの検証
        $validated = $request->validate([
            'start_time' => 'required|date|after:now',
            'menu_id' => 'required|exists:menus,id',
            'status' => 'required|in:pending,confirmed,cancelled',
            'customer_memo' => 'nullable|string',
        ]);

        $newStartTime = \Carbon\Carbon::parse($validated['start_time']);
        // 選択されたメニューの所要時間を取得して、終了時刻を計算
        $menu = \App\Models\Menu::findOrFail($validated['menu_id']);
        $newEndTime = $newStartTime->copy()->addMinutes($menu->duration_minutes);

        // ステータスがキャンセルの場合は枠を空けるのでチェック不要
        if ($validated['status'] !== 'cancelled') {
            // 対象曜日の出勤スタッフ数を取得（Card19のロジックを再利用）
            $dayOfWeek = strtolower($newStartTime->englishDayOfWeek);

            // Settingモデルから定休日を取得して比較！
            $settings = \App\Models\Setting::first();
            $regularHolidays = $settings ? ($settings->regular_holidays ?? []) : [];
            
            if (in_array($dayOfWeek, $regularHolidays)) {
                // フロントエンドの catch (error.response.status === 409) に引っ掛ける
                return response()->json(['message' => '指定された日付は店舗の定休日です。'], 409);
            }

            $availableStaffCount = \App\Models\Staff::where('is_active', true)
                ->whereHas('schedule', function ($q) use ($dayOfWeek) {
                    $q->where($dayOfWeek, true);
                })->count();

            // 「自分自身（$id）を除外」して重複をカウント！
            $overlappingBookings = Booking::where('id', '!=', $id) // 👈 これが超重要！
                ->where('status', '!=', 'cancelled')
                ->where(function ($query) use ($newStartTime, $newEndTime) {
                    $query->where('start_time', '<', $newEndTime)
                          ->where('end_time', '>', $newStartTime);
                })->count();

            // 枠が溢れていたら409エラーで弾く
            if ($overlappingBookings >= $availableStaffCount) {
                return response()->json(['message' => 'この時間は予約枠が埋まっています。'], 409);
            }
        }

        // 検証を通過したら更新
        $booking->update([
            'start_time' => $newStartTime,
            'end_time' => $newEndTime,
            'menu_id' => $validated['menu_id'],
            'status' => $validated['status'],
            'customer_memo' => $validated['customer_memo'],
        ]);

        return response()->json(['message' => '予約を更新しました', 'booking' => $booking]);
    }
}