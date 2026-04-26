<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Menu;
use App\Models\Setting;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Stripe\Refund;
use Stripe\Stripe;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
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

    public function store(Request $request): JsonResponse
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

        return DB::transaction(function () use ($validated) {
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
                })
                ->lockForUpdate()
                ->get();

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
            $bookingReference = 'BKG-'.strtoupper(Str::random(8));

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
        });
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $booking = Booking::findOrFail($id);

        // 送られてきたデータの検証
        $validated = $request->validate([
            'start_time' => 'required|date|after:now',
            'menu_id' => 'required|exists:menus,id',
            'status' => 'required|in:pending,confirmed,cancelled',
            'customer_memo' => 'nullable|string',
        ]);

        try {
            return DB::transaction(function () use ($validated, $id, $booking) {
                $newStartTime = Carbon::parse($validated['start_time']);
                // 選択されたメニューの所要時間を取得して、終了時刻を計算
                $menu = Menu::findOrFail($validated['menu_id']);
                $newEndTime = $newStartTime->copy()->addMinutes($menu->duration_minutes);

                // ステータスがキャンセルの場合は枠を空けるのでチェック不要
                if ($validated['status'] !== 'cancelled') {
                    $dayOfWeek = strtolower($newStartTime->englishDayOfWeek);
                    $settings = Setting::first();
                    $regularHolidays = $settings ? ($settings->regular_holidays ?? []) : [];

                    if (in_array($dayOfWeek, $regularHolidays)) {
                        // トランザクション内で例外を投げてキャッチさせる
                        throw new \Exception('指定された日付は店舗の定休日です。', 409);
                    }

                    $availableStaffCount = Staff::where('is_active', true)
                        ->whereHas('schedule', function ($q) use ($dayOfWeek) {
                            $q->where($dayOfWeek, true);
                        })
                        ->lockForUpdate()
                        ->count();

                    $overlappingBookings = Booking::where('id', '!=', $id)
                        ->where('status', '!=', 'cancelled')
                        ->where(function ($query) use ($newStartTime, $newEndTime) {
                            $query->where('start_time', '<', $newEndTime)
                                ->where('end_time', '>', $newStartTime);
                        })->count();

                    if ($overlappingBookings >= $availableStaffCount) {
                        throw new \Exception('この時間は予約枠が埋まっています。', 409);
                    }
                }

                // キャンセルへの変更、かつ支払い済みの場合の返金処理
                if ($validated['status'] === 'cancelled' && $booking->status !== 'cancelled') {
                    if ($booking->payment_status === 'paid' && $booking->stripe_payment_intent_id) {
                        Stripe::setApiKey(config('services.stripe.secret'));
                        try {
                            Refund::create([
                                'payment_intent' => $booking->stripe_payment_intent_id,
                            ]);
                            $booking->payment_status = 'refunded';
                        } catch (\Exception $e) {
                            // トランザクション内で例外を投げると、DBの変更が全て安全にロールバックされる
                            throw new \Exception('Stripeでの返金処理に失敗したため、更新を中断しました。', 500);
                        }
                    }
                }

                // 検証を通過したら更新
                $booking->update([
                    'start_time' => $newStartTime,
                    'end_time' => $newEndTime,
                    'menu_id' => $validated['menu_id'],
                    'status' => $validated['status'],
                    'customer_memo' => $validated['customer_memo'],
                    'payment_status' => $booking->payment_status, // 返金後のステータスも保存
                ]);

                return response()->json(['message' => '予約を更新しました', 'booking' => $booking]);
            });

        } catch (\Exception $e) {
            // トランザクション内で投げられた例外（エラー）をここで一括で受け取り、フロントへ返す
            $statusCode = $e->getCode() ?: 500;
            // 409や500など、意図したステータスコードがない場合は500にする
            $statusCode = in_array($statusCode, [400, 403, 404, 409, 500]) ? $statusCode : 500;

            return response()->json(['message' => $e->getMessage()], $statusCode);
        }
    }

    // 一覧検索API
    public function search(Request $request): JsonResponse
    {
        // 💡 スコープを活用！これだけで全条件の絞り込みが完了します
        $bookings = Booking::with(['menu', 'staff'])
            ->searchFilter($request->all())
            ->orderBy('start_time', 'desc')
            ->paginate(20);

        return response()->json($bookings);
    }

    // CSVダウンロードAPI
    public function exportCsv(Request $request): StreamedResponse
    {
        // 検索と同じスコープを使って対象データを取得
        $bookings = Booking::with(['menu', 'staff'])
            ->searchFilter($request->all())
            ->orderBy('start_time', 'desc')
            ->cursor(); // 🌟 1件ずつ省メモリで取り出す

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=bookings.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($bookings) {
            $file = fopen('php://output', 'w');
            // Excelで文字化けしないようにBOM（特殊な目印）をつける
            fwrite($file, "\xEF\xBB\xBF");

            // CSVの1行目（ヘッダー）
            fputcsv($file, ['予約番号', '予約日時', 'お名前', '電話番号', 'メール', 'メニュー', 'ステータス', '店舗メモ', 'アンケート回答']);

            // データ行
            foreach ($bookings as $booking) {
                // アンケート内容を結合
                $surveyText = '';
                // PHPStan対策1: survey_responsesの型を明示的に判定・変換
                $responses = $booking->survey_responses;

                // PHPStanには文字列に見えているので、文字列なら配列に変換する処理を挟む
                if (is_string($responses)) {
                    $responses = json_decode($responses, true);
                }

                if (is_array($responses)) {
                    $surveys = [];
                    foreach ($responses as $question => $answer) {
                        // 回答が配列（複数選択など）だった場合は、カンマ区切りで文字にする
                        $answerText = is_array($answer) ? implode(', ', $answer) : (string) $answer;
                        $surveys[] = "{$question}: {$answerText}";
                    }
                    $surveyText = implode(' / ', $surveys);
                }

                // PHPStan対策2: start_timeを確実にCarbonインスタンスにしてからformatを呼ぶ
                $startTime = \Carbon\Carbon::parse($booking->start_time)->format('Y-m-d H:i');

                // PHPStan対策3: $booking->menu が Menuモデルであることを注釈（PHPDoc）で教える
                /** @var Menu|null $menu */
                $menu = $booking->menu;
                $menuName = $menu ? $menu->name : '';

                fputcsv($file, [
                    $booking->booking_reference,
                    $startTime,
                    $booking->customer_name,
                    $booking->customer_phone,
                    $booking->customer_email,
                    $menuName,
                    $booking->status === 'cancelled' ? 'キャンセル' : '予約確定',
                    (string) $booking->customer_memo, // nullの可能性があるので明示的にstringへキャスト
                    $surveyText,
                ]);
            }
            fclose($file);
        };

        // 大量データでもメモリを圧迫しない stream ダウンロード方式
        return response()->stream($callback, 200, $headers);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,cancelled',
        ]);

        $booking = Booking::findOrFail($id);

        // 1. キャンセル処理の場合のみ、返金ロジックを挟む
        if ($validated['status'] === 'cancelled') {

            // 既にキャンセル済みの場合は何もしない
            if ($booking->status === 'cancelled') {
                return response()->json(['message' => 'この予約はすでにキャンセルされています。'], 400);
            }

            // 支払い済みなら、返金処理を実行（※DB更新の前に実行する！）
            if ($booking->payment_status === 'paid' && $booking->stripe_payment_intent_id) {
                Stripe::setApiKey(config('services.stripe.secret'));
                try {
                    Refund::create([
                        'payment_intent' => $booking->stripe_payment_intent_id,
                    ]);
                    // 返金成功時のみ、メモリ上のステータスを変更
                    $booking->payment_status = 'refunded';
                } catch (\Exception $e) {
                    // 返金エラー時はステータス変更を中断し、管理者にエラーを伝える
                    return response()->json(['message' => 'Stripeでの返金処理に失敗したため、キャンセルを中断しました。'], 500);
                }
            }
        }

        // 2. DBの更新（ステータスを一括保存）
        $booking->status = $validated['status'];
        $booking->save();

        return response()->json(['message' => 'ステータスを更新しました', 'booking' => $booking]);
    }
}
