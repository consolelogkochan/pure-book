<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\JsonResponse; // 追加

class MenuController extends Controller
{
    // メニュー一覧を返すメソッド
    public function index(): JsonResponse
    {
        // is_active が true のメニューだけを全件取得
        $menus = Menu::where('is_active', true)->get();

        return response()->json($menus);
    }
}
