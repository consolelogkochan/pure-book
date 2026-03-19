<?php

use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\StaffController;
use Illuminate\Http\Request;  // 追加
use Illuminate\Support\Facades\Route; // 追加

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ▼ここから追加▼
Route::get('/menus', [MenuController::class, 'index']);
Route::get('/staffs', [StaffController::class, 'index']);
