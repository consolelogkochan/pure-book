<?php

use App\Http\Controllers\Api\AvailableSlotController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\StaffController;  // 追加
use Illuminate\Http\Request; // 追加
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ▼ここから追加▼
Route::get('/menus', [MenuController::class, 'index']);
Route::get('/staffs', [StaffController::class, 'index']);

Route::get('/available-slots', [AvailableSlotController::class, 'index']);
