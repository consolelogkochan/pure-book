<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\StaffSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ResourceController extends Controller
{
    // 稼働中のスタッフと、そのスケジュールを合体させて取得
    public function index(): JsonResponse
    {
        // with('schedule') と書くだけで、1対1のリレーションデータを自動でくっつけてくれます！
        $staffs = Staff::where('is_active', true)->with('schedule')->get();
        return response()->json($staffs);
    }

    // 全員のシフトを一括で保存（更新）する処理
    public function updateBulk(Request $request): JsonResponse
    {
        $staffsData = $request->all();

        foreach ($staffsData as $data) {
            // updateOrCreate は「データがあれば更新、なければ新規作成」をしてくれる超便利メソッドです
            StaffSchedule::updateOrCreate(
                ['staff_id' => $data['id']], // 探す条件
                [
                    'monday' => $data['schedule']['monday'] ?? true,
                    'tuesday' => $data['schedule']['tuesday'] ?? true,
                    'wednesday' => $data['schedule']['wednesday'] ?? true,
                    'thursday' => $data['schedule']['thursday'] ?? true,
                    'friday' => $data['schedule']['friday'] ?? true,
                    'saturday' => $data['schedule']['saturday'] ?? true,
                    'sunday' => $data['schedule']['sunday'] ?? true,
                ]
            );
        }

        return response()->json(['message' => 'シフトを一括保存しました']);
    }
}