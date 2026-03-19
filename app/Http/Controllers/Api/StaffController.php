<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use Illuminate\Http\JsonResponse; // 追加

class StaffController extends Controller
{
    // スタッフ一覧を返すメソッド
    public function index(): JsonResponse
    {
        // is_active が true のスタッフだけを全件取得
        $staffs = Staff::where('is_active', true)->get();

        return response()->json($staffs);
    }
}
