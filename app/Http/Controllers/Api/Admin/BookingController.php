<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        // FullCalendarから自動的に送られてくる期間のパラメーターを取得
        $start = $request->query('start');
        $end = $request->query('end');

        // メニューとスタッフ情報も一緒に取得（N+1問題の回避）
        $query = Booking::with(['menu', 'staff']);

        // 期間指定があれば絞り込む
        if ($start && $end) {
            $query->whereBetween('start_time', [$start, $end]);
        }

        return response()->json($query->get());
    }
}