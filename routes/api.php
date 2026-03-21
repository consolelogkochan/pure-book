<?php

use App\Http\Controllers\Api\AvailableSlotController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\MenuController;  // 追加
use App\Http\Controllers\Api\StaffController; // 追加
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route; // 👈 忘れずに追加！

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ▼ここから追加▼
Route::get('/menus', [MenuController::class, 'index']);
Route::get('/staffs', [StaffController::class, 'index']);

Route::get('/available-slots', [AvailableSlotController::class, 'index']);

// ▼ここを追加（データの保存なので POST メソッドを使います）▼
Route::post('/bookings', [BookingController::class, 'store']);
