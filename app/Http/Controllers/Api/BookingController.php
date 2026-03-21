<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreBookingRequest; // さっき作った門番
use App\Models\Booking;
use App\Models\Menu;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
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

        try {
            // ▼ここから「トランザクション」開始
            // 途中でエラーが起きたら、DBへの変更をすべて「なかったこと（ロールバック）」にします
            $booking = DB::transaction(function () use ($validated, $menu, $startTime, $endTime, $requestedStaffId) {

                // 2. 排他制御（悲観的ロック：lockForUpdate）
                // 予約候補となるスタッフのデータを「今からチェックするから、他の人は触らないで！」とロックします
                $query = Staff::where('is_active', true)->lockForUpdate();
                if ($requestedStaffId) {
                    $query->where('id', $requestedStaffId);
                }
                $availableStaffs = $query->get();

                if ($availableStaffs->isEmpty()) {
                    throw new \Exception('指定された条件のスタッフが見つかりません。');
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
                    'status' => 'confirmed',
                ]);

            }); // ▲トランザクションここまで（無事に抜けたらロック解除＆保存完了）

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
}
