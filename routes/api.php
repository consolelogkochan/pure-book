<?php

use App\Http\Controllers\Api\Admin\BookingController as AdminBookingController;
use App\Http\Controllers\Api\Admin\MenuController as AdminMenuController;
// 顧客向けコントローラー
use App\Http\Controllers\Api\Admin\ResourceController;
use App\Http\Controllers\Api\Admin\SettingController;
use App\Http\Controllers\Api\Admin\StaffController as AdminStaffController;
use App\Http\Controllers\Api\Admin\SurveyQuestionController as AdminSurveyQuestionController;
use App\Http\Controllers\Api\AvailableSlotController;
// 管理者向けコントローラー
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\SurveyQuestionController as PublicSurveyQuestionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

/*
|--------------------------------------------------------------------------
| 顧客向けAPI
|--------------------------------------------------------------------------
*/
Route::get('/menus', [MenuController::class, 'index']);
Route::get('/staffs', [StaffController::class, 'index']);
Route::get('/available-slots', [AvailableSlotController::class, 'index']);
Route::get('/survey-questions', [PublicSurveyQuestionController::class, 'index']);

// ▼ リファクタリング：同じコントローラーはまとめる
Route::controller(BookingController::class)->group(function () {
    Route::post('/bookings', 'store');
    Route::post('/bookings/search', 'search');
    Route::delete('/bookings/{reference}', 'cancel');
});

/*
|--------------------------------------------------------------------------
| 管理者向けAPI
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->group(function () {

    Route::controller(AdminMenuController::class)->group(function () {
        Route::get('/menus', 'index');
        Route::post('/menus', 'store');
        Route::put('/menus/{menu}', 'update');
        Route::patch('/menus/{menu}/toggle-status', 'toggleStatus');
    });

    Route::controller(AdminStaffController::class)->group(function () {
        Route::get('/staffs', 'index');
        Route::post('/staffs', 'store');
        Route::put('/staffs/{staff}', 'update');
        Route::patch('/staffs/{staff}/toggle-status', 'toggleStatus');
    });

    Route::controller(ResourceController::class)->group(function () {
        Route::get('/resources', 'index');
        Route::post('/resources/bulk', 'updateBulk');
    });

    Route::controller(SettingController::class)->group(function () {
        Route::get('/settings', 'show');
        Route::put('/settings', 'update');
    });

    Route::controller(AdminSurveyQuestionController::class)->group(function () {
        Route::get('/survey-questions', 'index');
        Route::post('/survey-questions', 'store');
    });

    Route::controller(AdminBookingController::class)->group(function () {
        Route::get('/bookings/search', 'search');
        Route::get('/bookings/csv', 'exportCsv');
        Route::get('/bookings', 'index');
        Route::post('/bookings', 'store');
        Route::put('/bookings/{id}', 'update');
        Route::patch('/bookings/{id}/status', 'updateStatus');
    });
});
