<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreBookingRequest;
use App\Mail\BookingCancelled;
use App\Mail\BookingConfirmed;
use App\Mail\PaymentCompleted;
use App\Models\Booking;
use App\Models\Menu;
use App\Models\Staff;
use App\Services\StripeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function store(StoreBookingRequest $request): JsonResponse
    {
        // 1. 門番を通過した安全なデータだけを取得
        $validated = $request->validated();

        $menu = Menu::findOrFail($validated['menu_id']);
        $startTime = Carbon::parse($validated['start_time']);
        $endTime = $startTime->copy()->addMinutes($menu->duration_minutes);
        $requestedStaffId = $validated['staff_id'] ?? null;

        // ▼ 追加：リクエストされた日時の「曜日（英語の小文字）」を取得（例: 'monday'）
        $dayOfWeek = strtolower($startTime->englishDayOfWeek);

        try {
            // ▼ここから「トランザクション」開始
            // 途中でエラーが起きたら、DBへの変更をすべて「なかったこと（ロールバック）」にします
            $booking = DB::transaction(function () use ($validated, $menu, $startTime, $endTime, $requestedStaffId, $dayOfWeek) {

                // 2. 排他制御（悲観的ロック）＋ シフト（曜日）のチェック
                $query = Staff::where('is_active', true)
                    // ▼ 追加：scheduleテーブルを覗きに行き、該当の曜日が true(出勤) のスタッフに絞り込む
                    ->whereHas('schedule', function ($q) use ($dayOfWeek) {
                        $q->where($dayOfWeek, true);
                    })
                    ->lockForUpdate();
                if ($requestedStaffId) {
                    $query->where('id', $requestedStaffId);
                }
                $availableStaffs = $query->get();

                if ($availableStaffs->isEmpty()) {
                    throw new \Exception('指定された日時はスタッフがお休み、または条件に合うスタッフが見つかりません。');
                }

                // 3. ロックしたスタッフたちの「その時間の既存予約」を取得
                $staffIds = $availableStaffs->pluck('id');
                $overlappingBookings = Booking::whereIn('staff_id', $staffIds)
                    ->where('status', '!=', 'cancelled')
                    ->where(function ($query) use ($startTime, $endTime) {
                        // Card 3で学んだ「美しい重複判定」をSQL（データベースへの指示）で表現
                        $query->where('start_time', '<', $endTime)
                            ->where('end_time', '>', $startTime);
                    })
                    ->get();

                // 4. 空いているスタッフを1人割り当てる
                $assignedStaff = null;
                foreach ($availableStaffs as $staff) {
                    $hasConflict = $overlappingBookings->where('staff_id', $staff->id)->isNotEmpty();
                    if (! $hasConflict) {
                        $assignedStaff = $staff;
                        break; // 1人見つかればOKなのでループを抜ける
                    }
                }

                // もし全員埋まっていたら（タッチの差で先に予約された場合など）
                if (! $assignedStaff) {
                    throw new \Exception('申し訳ありません。タッチの差で予約が埋まってしまいました。');
                }

                // 5. 予約番号の生成（例: BKG-大文字英数字8桁）
                $bookingReference = 'BKG-'.strtoupper(Str::random(8));

                // 6. 予約の確定（DBへ保存）
                return Booking::create([
                    'booking_reference' => $bookingReference,
                    'user_id' => auth()->id(), // ログインしていなければ null になる
                    'staff_id' => $assignedStaff->id,
                    'menu_id' => $menu->id,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'customer_name' => $validated['customer_name'],
                    'customer_email' => $validated['customer_email'],
                    'customer_phone' => $validated['customer_phone'],
                    'customer_memo' => $validated['customer_memo'] ?? null,
                    'survey_responses' => $validated['survey_responses'] ?? null,
                    'status' => 'confirmed',
                ]);

            }); // ▲トランザクションここまで（無事に抜けたらロック解除＆保存完了）

            // 非同期で予約完了メールを送信する指示（キューに投げる）
            Mail::to($booking->customer_email)->queue(new BookingConfirmed($booking));

            // 成功レスポンス（201 Created）
            return response()->json([
                'message' => '予約が完了しました！',
                'booking' => $booking,
            ], 201);

        } catch (\Exception $e) {
            // エラーレスポンス（409 Conflict）
            return response()->json([
                'message' => $e->getMessage(),
            ], 409);
        }
    }

    // 予約照会メソッド
    public function search(Request $request): JsonResponse
    {
        // 1. 予約番号、メールアドレスの入力データを受け取る（推論通り！）
        $validated = $request->validate([
            'booking_reference' => ['required', 'string'],
            'email' => ['required', 'email'],
        ]);

        // 2. データベースのBookingから、一致するデータを取得する
        // （with()を使うことで、紐づくメニュー名やスタッフ名も一緒に取得できます）
        $booking = Booking::with(['menu', 'staff'])
            ->where('booking_reference', $validated['booking_reference'])
            ->where('customer_email', $validated['email'])
            ->first(); // 1件だけ取得（見つからなければ null になる）

        // もしデータが見つからなかった場合は、404エラー（Not Found）を返す
        if (! $booking) {
            return response()->json([
                'message' => '指定された予約が見つかりません。入力内容をご確認ください。',
            ], 404);
        }

        // 3. 取得したBookingに保存されているデータを返す
        return response()->json([
            'message' => '予約が見つかりました。',
            'booking' => $booking,
        ]);
    }

    /**
     * 決済の準備（PaymentIntentの作成）
     */
    public function createPaymentIntent(string $reference, StripeService $stripeService): JsonResponse
    {
        $booking = Booking::with('menu')->where('booking_reference', $reference)->firstOrFail();

        if ($booking->payment_status === 'paid') {
            return response()->json(['message' => '既に支払い済みです。'], 400);
        }

        /** @var Menu $menu */
        $menu = $booking->menu;

        $paymentIntent = $stripeService->createPaymentIntent(
            $menu->price,
            [
                'booking_id'        => (string) $booking->id,
                'booking_reference' => $booking->booking_reference,
            ]
        );

        return response()->json([
            'clientSecret' => $paymentIntent->client_secret,
        ]);
    }

    /**
     * 決済の検証とDB更新
     */
    public function verifyPayment(Request $request, string $reference, StripeService $stripeService): JsonResponse
    {
        $validated = $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        $booking = Booking::with('menu')->where('booking_reference', $reference)->firstOrFail();

        $intent = $stripeService->retrievePaymentIntent($validated['payment_intent_id']);

        if ($intent->status === 'succeeded') {
            $booking->update([
                'payment_status'           => 'paid',
                'stripe_payment_intent_id' => $intent->id,
            ]);

            Mail::to($booking->customer_email)->queue(new PaymentCompleted($booking));

            return response()->json(['message' => '決済を確認しました！', 'booking' => $booking]);
        }

        return response()->json(['message' => '決済が完了していないか、失敗しました。'], 400);
    }

    // 予約キャンセルメソッド
    public function cancel(Request $request, string $reference, StripeService $stripeService): JsonResponse
    {
        // セキュリティ対策：誰でもキャンセルできないよう、メールアドレスも一緒に送ってもらいます
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        // 予約番号とメールアドレスで本人確認
        $booking = Booking::where('booking_reference', $reference)
            ->where('customer_email', $validated['email'])
            ->first();

        if (! $booking) {
            return response()->json(['message' => '予約が見つからないか、認証に失敗しました。'], 404);
        }

        // 既にキャンセル済みの場合はエラーを返す
        if ($booking->status === 'cancelled') {
            return response()->json(['message' => 'この予約はすでにキャンセルされています。'], 400);
        }

        // 1. 予約の'start_time'から24時間を引いた日時を計算する（Carbonの subHours() を使用）
        $cancelDeadline = Carbon::parse($booking->start_time)->subHours(24);
        $now = Carbon::now();

        // 2. 現在の時刻と計算した日時を比較する
        if ($now > $cancelDeadline) {
            // 現在時刻が期限を過ぎている場合は、403エラー（Forbidden：禁止）を返す
            return response()->json([
                'message' => 'キャンセル期限（予約の24時間前）を過ぎているため、システムからのキャンセルはできません。店舗へ直接お電話ください。',
            ], 403);
        }

        // 3.支払い済みなら、返金処理を実行
        if ($booking->payment_status === 'paid' && $booking->stripe_payment_intent_id) {
            try {
                $stripeService->refund($booking->stripe_payment_intent_id);
                $booking->payment_status = 'refunded';
            } catch (\Exception $e) {
                return response()->json(['message' => '返金処理中にエラーが発生しました。'], 500);
            }
        }

        // 4. DBの更新（ステータスを cancelled に更新し、一括保存）
        // ※返金が成功した、または未決済だった場合のみここへ到達します
        $booking->status = 'cancelled';
        $booking->save();

        // 5.非同期でキャンセル完了メールを送信する指示（キューに投げる）
        Mail::to($booking->customer_email)->queue(new BookingCancelled($booking));

        // 6. キャンセル成功のテキストを返す
        return response()->json([
            'message' => '予約のキャンセルが完了しました。',
            'booking' => $booking,
        ]);
    }
}
