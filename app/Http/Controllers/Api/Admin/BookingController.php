<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use App\Models\Menu;
use App\Models\Setting;
use Illuminate\Support\Carbon;
use App\Models\Staff;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Response;

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

    public function store(Request $request)
    {
        //  フロントから送られてきた入力値の形式チェック
        $validated = $request->validate([
            'start_time' => 'required|date|after:now',
            'menu_id' => 'required|exists:menus,id',
            'status' => 'required|in:pending,confirmed,cancelled',
            'customer_name' => 'required|string',
            'customer_phone' => 'required|string', // 新規なので連絡先も必須
            'customer_email' => 'required|email',  // 新規なので連絡先も必須
            'customer_memo' => 'nullable|string',
        ]);

        //  メニューの所要時間から終了時刻を計算
        $newStartTime = Carbon::parse($validated['start_time']);
        $menu = Menu::findOrFail($validated['menu_id']);
        $newEndTime = $newStartTime->copy()->addMinutes($menu->duration_minutes);

        $dayOfWeek = strtolower($newStartTime->englishDayOfWeek);
        $settings = Setting::first();
        $regularHolidays = $settings ? ($settings->regular_holidays ?? []) : [];
        
        if (in_array($dayOfWeek, $regularHolidays)) {
            return response()->json(['message' => '指定された日付は店舗の定休日です。'], 409);
        }

        //  重複・空き枠のチェック
        // 指定曜日の出勤スタッフ一覧を取得（誰に割り当てるかを決めるため、count ではなく get にします）
        $availableStaffs = Staff::where('is_active', true)
            ->whereHas('schedule', function ($q) use ($dayOfWeek) {
                $q->where($dayOfWeek, true);
            })->get();

        if ($availableStaffs->isEmpty()) {
             return response()->json(['message' => '指定された曜日に出勤するスタッフがいません。'], 409);
        }

        // 既存の予約（キャンセル以外）で被っているものを数える（新規なので自分自身の除外は不要）
        $overlappingBookings = Booking::where('status', '!=', 'cancelled')
            ->where(function ($query) use ($newStartTime, $newEndTime) {
                $query->where('start_time', '<', $newEndTime)
                      ->where('end_time', '>', $newStartTime);
            })->count();

        if ($overlappingBookings >= $availableStaffs->count()) {
            return response()->json(['message' => 'この時間は予約枠が埋まっています。'], 409);
        }

        //  予約番号の生成（BKG-ランダム大文字英数字8桁）
        $bookingReference = 'BKG-' . strtoupper(Str::random(8));

        //  DBへの保存処理
        $booking = Booking::create([
            'booking_reference' => $bookingReference,
            'user_id' => null, // 管理者からの追加はゲスト扱い（会員紐付けなし）
            'staff_id' => $availableStaffs->first()->id, // とりあえず出勤している最初のスタッフを自動割当
            'menu_id' => $validated['menu_id'],
            'start_time' => $newStartTime,
            'end_time' => $newEndTime,
            'customer_name' => $validated['customer_name'],
            'customer_email' => $validated['customer_email'],
            'customer_phone' => $validated['customer_phone'],
            'customer_memo' => $validated['customer_memo'],
            'status' => $validated['status'],
            'survey_responses' => null, // 管理者登録なのでアンケートは空
        ]);

        return response()->json(['message' => '新規予約を作成しました', 'booking' => $booking], 201);
    }

    public function update(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);

        // 送られてきたデータの検証
        $validated = $request->validate([
            'start_time' => 'required|date|after:now',
            'menu_id' => 'required|exists:menus,id',
            'status' => 'required|in:pending,confirmed,cancelled',
            'customer_memo' => 'nullable|string',
        ]);

        $newStartTime = Carbon::parse($validated['start_time']);
        // 選択されたメニューの所要時間を取得して、終了時刻を計算
        $menu = Menu::findOrFail($validated['menu_id']);
        $newEndTime = $newStartTime->copy()->addMinutes($menu->duration_minutes);

        // ステータスがキャンセルの場合は枠を空けるのでチェック不要
        if ($validated['status'] !== 'cancelled') {
            // 対象曜日の出勤スタッフ数を取得（Card19のロジックを再利用）
            $dayOfWeek = strtolower($newStartTime->englishDayOfWeek);

            // Settingモデルから定休日を取得して比較！
            $settings = Setting::first();
            $regularHolidays = $settings ? ($settings->regular_holidays ?? []) : [];
            
            if (in_array($dayOfWeek, $regularHolidays)) {
                // フロントエンドの catch (error.response.status === 409) に引っ掛ける
                return response()->json(['message' => '指定された日付は店舗の定休日です。'], 409);
            }

            $availableStaffCount = Staff::where('is_active', true)
                ->whereHas('schedule', function ($q) use ($dayOfWeek) {
                    $q->where($dayOfWeek, true);
                })->count();

            // 「自分自身（$id）を除外」して重複をカウント！
            $overlappingBookings = Booking::where('id', '!=', $id) // 👈 これが超重要！
                ->where('status', '!=', 'cancelled')
                ->where(function ($query) use ($newStartTime, $newEndTime) {
                    $query->where('start_time', '<', $newEndTime)
                          ->where('end_time', '>', $newStartTime);
                })->count();

            // 枠が溢れていたら409エラーで弾く
            if ($overlappingBookings >= $availableStaffCount) {
                return response()->json(['message' => 'この時間は予約枠が埋まっています。'], 409);
            }
        }

        // 検証を通過したら更新
        $booking->update([
            'start_time' => $newStartTime,
            'end_time' => $newEndTime,
            'menu_id' => $validated['menu_id'],
            'status' => $validated['status'],
            'customer_memo' => $validated['customer_memo'],
        ]);

        return response()->json(['message' => '予約を更新しました', 'booking' => $booking]);
    }

    // 一覧検索API
    public function search(Request $request)
    {
        // 💡 スコープを活用！これだけで全条件の絞り込みが完了します
        $bookings = Booking::with(['menu', 'staff'])
            ->searchFilter($request->all())
            ->orderBy('start_time', 'desc')
            ->get();

        return response()->json($bookings);
    }

    // CSVダウンロードAPI
    public function exportCsv(Request $request)
    {
        // 検索と同じスコープを使って対象データを取得
        $bookings = Booking::with(['menu', 'staff'])
            ->searchFilter($request->all())
            ->orderBy('start_time', 'desc')
            ->get();

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=bookings.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($bookings) {
            $file = fopen('php://output', 'w');
            // Excelで文字化けしないようにBOM（特殊な目印）をつける
            fputs($file, "\xEF\xBB\xBF");
            
            // CSVの1行目（ヘッダー）
            fputcsv($file, ['予約番号', '予約日時', 'お名前', '電話番号', 'メール', 'メニュー', 'ステータス', '店舗メモ']);

            // データ行
            foreach ($bookings as $booking) {
                fputcsv($file, [
                    $booking->booking_reference,
                    $booking->start_time->format('Y-m-d H:i'),
                    $booking->customer_name,
                    $booking->customer_phone,
                    $booking->customer_email,
                    $booking->menu ? $booking->menu->name : '',
                    $booking->status === 'cancelled' ? 'キャンセル' : '予約確定',
                    $booking->customer_memo
                ]);
            }
            fclose($file);
        };

        // 大量データでもメモリを圧迫しない stream ダウンロード方式
        return response()->stream($callback, 200, $headers);
    }
}