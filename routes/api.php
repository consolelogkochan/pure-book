<?php

use App\Http\Controllers\Api\AvailableSlotController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\MenuController;  // 追加
use App\Http\Controllers\Api\StaffController; // 追加
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route; // 👈 忘れずに追加！
use App\Http\Controllers\Api\Admin\MenuController as AdminMenuController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ▼ここから追加▼
Route::get('/menus', [MenuController::class, 'index']);
Route::get('/staffs', [StaffController::class, 'index']);

Route::get('/available-slots', [AvailableSlotController::class, 'index']);

// ▼ここを追加（データの保存なので POST メソッドを使います）▼
Route::post('/bookings', [BookingController::class, 'store']);

// 1. 予約照会API（検索条件を送るためPOSTを使います）
Route::post('/bookings/search', [BookingController::class, 'search']);

// 2. 予約キャンセルAPI（URLに予約番号を含め、削除を意味するDELETEを使います）
Route::delete('/bookings/{reference}', [BookingController::class, 'cancel']);

// ▼ 追加：管理者用API（URLの先頭に /admin がつく）
Route::prefix('admin')->group(function () {
    Route::get('/menus', [AdminMenuController::class, 'index']);
    Route::post('/menus', [AdminMenuController::class, 'store']);
    Route::put('/menus/{menu}', [AdminMenuController::class, 'update']);
    Route::patch('/menus/{menu}/toggle-status', [AdminMenuController::class, 'toggleStatus']);
});
