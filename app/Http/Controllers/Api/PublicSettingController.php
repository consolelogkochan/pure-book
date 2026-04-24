<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class PublicSettingController extends Controller
{
    /**
     * お客様向けに公開する店舗設定を取得
     */
    public function show(): JsonResponse
    {
        // id=1の設定を取得（万が一無い場合は初期値を生成）
        $setting = Setting::firstOrCreate(
            ['id' => 1],
            [
                'open_time' => '10:00:00',
                'close_time' => '20:00:00',
                'regular_holidays' => [],
                'terms_text' => null, // 初期値は空にしておく
            ]
        );

        // 必要最小限のデータだけを返す（セキュリティ対策）
        return response()->json([
            'terms_text' => $setting->terms_text,
            'open_time' => $setting->open_time,
            'close_time' => $setting->close_time,
            'regular_holidays' => $setting->regular_holidays,
        ]);
    }
}
