<?php

namespace App\Http\Controllers\Api;

use App\Contracts\StripeServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreBookingRequest;
use App\Mail\BookingCancelled;
use App\Mail\BookingConfirmed;
use App\Mail\PaymentCompleted;
use App\Models\Booking;
use App\Models\Menu;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class BookingController extends Controller
{
    public function store(StoreBookingRequest $request, BookingService $bookingService): JsonResponse
    {
        // 1. 門番を通過した安全なデータだけを取得
        $validated = $request->validated();

        $menu = Menu::findOrFail($validated['menu_id']);
        $startTime = Carbon::parse($validated['start_time']);
        $requestedStaffId = isset($validated['staff_id']) ? (int) $validated['staff_id'] : null;

        try {
            $booking = DB::transaction(function () use ($validated, $menu, $startTime, $requestedStaffId, $bookingService) {
                $endTime = $bookingService->calculateEndTime($startTime, $menu->duration_minutes);
                $dayOfWeek = $bookingService->extractDayOfWeek($startTime);

                $bookingService->checkRegularHoliday($dayOfWeek);

                $availableStaffs = $bookingService->getAvailableStaffs($dayOfWeek, $requestedStaffId);

                if ($availableStaffs->isEmpty()) {
                    throw new \Exception('指定された日時はスタッフがお休み、または条件に合うスタッフが見つかりません。');
                }

                $overlappingBookings = $bookingService->findOverlappingBookingsByStaffs($availableStaffs, $startTime, $endTime);

                $assignedStaff = $bookingService->assignStaff($availableStaffs, $overlappingBookings);

                return $bookingService->createBooking([
                    'booking_reference' => $bookingService->generateBookingReference(),
                    'user_id' => auth()->id(),
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
            });

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
    public function createPaymentIntent(string $reference, StripeServiceInterface $stripeService): JsonResponse
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
                'booking_id' => (string) $booking->id,
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
    public function verifyPayment(Request $request, string $reference, StripeServiceInterface $stripeService): JsonResponse
    {
        $validated = $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        $booking = Booking::with('menu')->where('booking_reference', $reference)->firstOrFail();

        $intent = $stripeService->retrievePaymentIntent($validated['payment_intent_id']);

        if ($intent->status === 'succeeded') {
            $booking->update([
                'payment_status' => 'paid',
                'stripe_payment_intent_id' => $intent->id,
            ]);

            Mail::to($booking->customer_email)->queue(new PaymentCompleted($booking));

            return response()->json(['message' => '決済を確認しました！', 'booking' => $booking]);
        }

        return response()->json(['message' => '決済が完了していないか、失敗しました。'], 400);
    }

    // 予約キャンセルメソッド
    public function cancel(Request $request, string $reference, StripeServiceInterface $stripeService, BookingService $bookingService): JsonResponse
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

        try {
            $bookingService->checkCancelDeadline($booking);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        }

        // 支払い済みなら、返金処理を実行
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
