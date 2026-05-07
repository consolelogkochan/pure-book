<?php

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\StripeServiceInterface;
use App\Exports\BookingCsvExporter;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Menu;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
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

    public function store(Request $request, BookingService $bookingService): JsonResponse
    {
        $validated = $request->validate([
            'start_time' => 'required|date|after:now',
            'menu_id' => 'required|exists:menus,id',
            'status' => 'required|in:pending,confirmed,cancelled',
            'customer_name' => 'required|string',
            'customer_phone' => 'required|string',
            'customer_email' => 'required|email',
            'customer_memo' => 'nullable|string',
        ]);

        try {
            return DB::transaction(function () use ($validated, $bookingService) {
                $newStartTime = Carbon::parse($validated['start_time']);
                $menu = Menu::findOrFail($validated['menu_id']);
                $newEndTime = $bookingService->calculateEndTime($newStartTime, $menu->duration_minutes);
                $dayOfWeek = $bookingService->extractDayOfWeek($newStartTime);

                $bookingService->checkRegularHoliday($dayOfWeek);

                $availableStaffs = $bookingService->getAvailableStaffs($dayOfWeek);

                if ($availableStaffs->isEmpty()) {
                    throw new \Exception('指定された曜日に出勤するスタッフがいません。', 409);
                }

                $overlappingBookings = $bookingService->findOverlappingBookingsByStaffs($availableStaffs, $newStartTime, $newEndTime);
                $assignedStaff = $bookingService->assignStaff($availableStaffs, $overlappingBookings);

                $booking = $bookingService->createBooking([
                    'booking_reference' => $bookingService->generateBookingReference(),
                    'user_id' => null,
                    'staff_id' => $assignedStaff->id,
                    'menu_id' => $validated['menu_id'],
                    'start_time' => $newStartTime,
                    'end_time' => $newEndTime,
                    'customer_name' => $validated['customer_name'],
                    'customer_email' => $validated['customer_email'],
                    'customer_phone' => $validated['customer_phone'],
                    'customer_memo' => $validated['customer_memo'],
                    'status' => $validated['status'],
                    'survey_responses' => null,
                ]);

                return response()->json(['message' => '新規予約を作成しました', 'booking' => $booking], 201);
            });
        } catch (\Exception $e) {
            $statusCode = $e->getCode() ?: 500;
            $statusCode = in_array($statusCode, [400, 403, 404, 409, 500]) ? $statusCode : 500;

            return response()->json(['message' => $e->getMessage()], $statusCode);
        }
    }

    public function update(Request $request, string $id, StripeServiceInterface $stripeService, BookingService $bookingService): JsonResponse
    {
        $booking = Booking::findOrFail($id);

        // 過去の予約の編集をブロック（Fail Fast）
        if (now()->greaterThan($booking->end_time)) {
            return response()->json(['message' => '終了時刻を過ぎた予約は編集・キャンセルできません。'], 403);
        }

        // 送られてきたデータの検証
        $validated = $request->validate([
            'start_time' => 'required|date|after:now',
            'menu_id' => 'required|exists:menus,id',
            'status' => 'required|in:pending,confirmed,cancelled',
            'customer_memo' => 'nullable|string',
        ]);

        try {
            return DB::transaction(function () use ($validated, $id, $booking, $stripeService, $bookingService) {
                $newStartTime = Carbon::parse($validated['start_time']);
                $menu = Menu::findOrFail($validated['menu_id']);
                $newEndTime = $bookingService->calculateEndTime($newStartTime, $menu->duration_minutes);

                // ステータスがキャンセルの場合は枠を空けるのでチェック不要
                $assignedStaff = null;
                if ($validated['status'] !== 'cancelled') {
                    $dayOfWeek = $bookingService->extractDayOfWeek($newStartTime);

                    $bookingService->checkRegularHoliday($dayOfWeek);

                    $availableStaffs = $bookingService->getAvailableStaffs($dayOfWeek);

                    if ($availableStaffs->isEmpty()) {
                        throw new \Exception('指定された曜日に出勤するスタッフがいません。', 409);
                    }

                    $overlappingBookings = $bookingService->findOverlappingBookingsByStaffs($availableStaffs, $newStartTime, $newEndTime)
                        ->where('id', '!=', (int) $id);
                    $assignedStaff = $bookingService->assignStaff($availableStaffs, $overlappingBookings);
                }

                // キャンセルへの変更、かつ支払い済みの場合の返金処理
                if ($validated['status'] === 'cancelled' && $booking->status !== 'cancelled') {
                    if ($booking->payment_status === 'paid' && $booking->stripe_payment_intent_id) {
                        try {
                            $stripeService->refund($booking->stripe_payment_intent_id);
                            $booking->payment_status = 'refunded';
                        } catch (\Exception $e) {
                            throw new \Exception('Stripeでの返金処理に失敗したため、更新を中断しました。', 500);
                        }
                    }
                }

                // 検証を通過したら更新
                $updateData = [
                    'start_time' => $newStartTime,
                    'end_time' => $newEndTime,
                    'menu_id' => $validated['menu_id'],
                    'status' => $validated['status'],
                    'customer_memo' => $validated['customer_memo'],
                    'payment_status' => $booking->payment_status,
                ];
                if ($assignedStaff !== null) {
                    $updateData['staff_id'] = $assignedStaff->id;
                }
                $booking->update($updateData);

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
    public function exportCsv(Request $request, BookingCsvExporter $exporter): StreamedResponse
    {
        // lazy() は内部で 500件ずつ取得し、with() のEager Loadingもチャンク単位で実行する。
        // cursor() + with() は関連モデルを全件一括メモリに保持するため、大量データに不向き。
        $bookings = Booking::with(['menu', 'staff'])
            ->searchFilter($request->all())
            ->orderBy('start_time', 'desc')
            ->lazy(500);

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=bookings.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($bookings, $exporter) {
            $file = fopen('php://output', 'w');
            if ($file === false) {
                return;
            }
            fwrite($file, "\xEF\xBB\xBF");
            fputcsv($file, $exporter->headers());
            foreach ($bookings as $booking) {
                fputcsv($file, $exporter->buildRow($booking));
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function updateStatus(Request $request, string $id, StripeServiceInterface $stripeService): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,cancelled',
        ]);

        $booking = Booking::findOrFail($id);

        // 過去の予約のステータス変更をブロック（Fail Fast）
        if (now()->greaterThan($booking->end_time)) {
            return response()->json(['message' => '終了時刻を過ぎた予約は操作できません。'], 403);
        }

        // 1. キャンセル処理の場合のみ、返金ロジックを挟む
        if ($validated['status'] === 'cancelled') {

            // 既にキャンセル済みの場合は何もしない
            if ($booking->status === 'cancelled') {
                return response()->json(['message' => 'この予約はすでにキャンセルされています。'], 400);
            }

            // 支払い済みなら、返金処理を実行（※DB更新の前に実行する！）
            if ($booking->payment_status === 'paid' && $booking->stripe_payment_intent_id) {
                try {
                    $stripeService->refund($booking->stripe_payment_intent_id);
                    $booking->payment_status = 'refunded';
                } catch (\Exception $e) {
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
