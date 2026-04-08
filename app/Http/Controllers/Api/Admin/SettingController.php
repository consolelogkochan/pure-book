<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    // 店舗設定の取得
    public function show(): JsonResponse
    {
        // 💡 1行限定の裏技: firstOrCreate()
        // 「id=1 のデータを探し、もし無ければ初期値で新しく作ってから返す」という超便利メソッドです！
        // これにより、手動で初期データを入れる手間（シーダー作成）が省けます。
        $setting = Setting::firstOrCreate(
            ['id' => 1],
            [
                'open_time' => '10:00:00',
                'close_time' => '20:00:00',
                'regular_holidays' => [],
                'terms_text' => "当サロンのご利用にあたり、以下の規約にご同意ください。\n\n1. キャンセルについて...",
                // ▼ 追加：初期値は「2時間前まで」にしておく
                'booking_deadline_type' => 'time_based',
                'booking_deadline_hours' => 2,
                'booking_deadline_days' => 1,
                'booking_deadline_time' => '17:00:00',
            ]
        );

        return response()->json($setting);
    }

    // 店舗設定の更新
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'open_time' => 'required|date_format:H:i', // "10:00" のような形式かチェック
            'close_time' => 'required|date_format:H:i|after:open_time', // 閉店は開店より後かチェック
            'regular_holidays' => 'nullable|array',
            'terms_text' => 'nullable|string',
            // ▼ 追加：バリデーション（安全確認）
            'booking_deadline_type' => 'required|in:time_based,date_based',
            'booking_deadline_hours' => 'nullable|integer|min:0',
            'booking_deadline_days' => 'nullable|integer|min:0',
            'booking_deadline_time' => 'nullable|date_format:H:i',
        ]);

        // 常に id=1 のデータを更新する
        $setting = Setting::firstOrFail(); // 万が一無い場合は404エラーにする
        $setting->update($validated);

        return response()->json($setting);
    }
}