<?php

use App\Http\Controllers\Api\AvailableSlotController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\MenuController;  
use App\Http\Controllers\Api\StaffController; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route; // 👈 忘れずに追加！
use App\Http\Controllers\Api\Admin\MenuController as AdminMenuController;
use App\Http\Controllers\Api\Admin\StaffController as AdminStaffController;
use App\Http\Controllers\Api\Admin\ResourceController;
use App\Http\Controllers\Api\Admin\SettingController;
use App\Http\Controllers\Api\Admin\SurveyQuestionController;
use App\Http\Controllers\Api\SurveyQuestionController as PublicSurveyQuestionController;
use App\Http\Controllers\Api\Admin\BookingController as AdminBookingController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ▼ここから追加▼
Route::get('/menus', [MenuController::class, 'index']);
Route::get('/staffs', [StaffController::class, 'index']);

Route::get('/available-slots', [AvailableSlotController::class, 'index']);

Route::get('/survey-questions', [App\Http\Controllers\Api\SurveyQuestionController::class, 'index']);

// ▼ここを追加（データの保存なので POST メソッドを使います）▼
Route::post('/bookings', [BookingController::class, 'store']);

// 1. 予約照会API（検索条件を送るためPOSTを使います）
Route::post('/bookings/search', [BookingController::class, 'search']);

// 2. 予約キャンセルAPI（URLに予約番号を含め、削除を意味するDELETEを使います）
Route::delete('/bookings/{reference}', [BookingController::class, 'cancel']);

// ▼ 追加：管理者用API（URLの先頭に /admin がつく）
Route::prefix('admin')->group(function () {
    // メニュー管理
    Route::get('/menus', [AdminMenuController::class, 'index']);
    Route::post('/menus', [AdminMenuController::class, 'store']);
    Route::put('/menus/{menu}', [AdminMenuController::class, 'update']);
    Route::patch('/menus/{menu}/toggle-status', [AdminMenuController::class, 'toggleStatus']);

    // スタッフ管理
    Route::get('/staffs', [AdminStaffController::class, 'index']);
    Route::post('/staffs', [AdminStaffController::class, 'store']);
    Route::put('/staffs/{staff}', [AdminStaffController::class, 'update']);
    Route::patch('/staffs/{staff}/toggle-status', [AdminStaffController::class, 'toggleStatus']);

    // リソース（シフト）管理
    Route::get('/resources', [ResourceController::class, 'index']);
    Route::post('/resources/bulk', [ResourceController::class, 'updateBulk']);

    // 店舗設定（常に1つのデータを扱うので、URLはシンプルに）
    Route::get('/settings', [SettingController::class, 'show']);
    Route::put('/settings', [SettingController::class, 'update']);

    // アンケート管理
    Route::get('/survey-questions', [SurveyQuestionController::class, 'index']);
    Route::post('/survey-questions', [SurveyQuestionController::class, 'store']);

    // 予約管理（予約の一覧を取得するAPI）
    Route::get('/bookings', [App\Http\Controllers\Api\Admin\BookingController::class, 'index']);

    // 予約管理（予約の更新API） 
    Route::put('/bookings/{id}', [App\Http\Controllers\Api\Admin\BookingController::class, 'update']);
    // 予約管理（予約の作成API）
    Route::post('/bookings', [App\Http\Controllers\Api\Admin\BookingController::class, 'store']);
});
