<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MenuController extends Controller
{
    // 1. メニュー全件取得（非公開も含む）
    public function index(): JsonResponse
    {
        // 管理者はすべて見るので where句はなし。新しい順に取得。
        $menus = Menu::orderBy('id', 'desc')->get();
        return response()->json($menus);
    }

    // 2. メニューの新規作成
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|integer|min:0',
            'duration_minutes' => 'required|integer|min:10',
        ]);

        $menu = Menu::create($validated);
        return response()->json($menu, 201);
    }

    // 3. メニューの編集
    public function update(Request $request, Menu $menu): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|integer|min:0',
            'duration_minutes' => 'required|integer|min:10',
        ]);

        $menu->update($validated);
        return response()->json($menu);
    }

    // 4. 公開/非公開の切り替え（論理削除の代わり）
    public function toggleStatus(Menu $menu): JsonResponse
    {
        $menu->update([
            'is_active' => !$menu->is_active // 現在の状態を反転させる
        ]);
        return response()->json($menu);
    }
}