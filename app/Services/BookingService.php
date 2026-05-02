<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Setting;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class BookingService
{
    /**
     * 指定曜日に出勤している有効なスタッフを悲観的ロック付きで取得する
     *
     * @return Collection<int, Staff>
     */
    public function getAvailableStaffs(string $dayOfWeek, ?int $requestedStaffId = null): Collection
    {
        $query = Staff::where('is_active', true)
            ->whereHas('schedule', function ($q) use ($dayOfWeek) {
                $q->where($dayOfWeek, true);
            })
            ->lockForUpdate();

        if ($requestedStaffId !== null) {
            $query->where('id', $requestedStaffId);
        }

        return $query->get();
    }

    /**
     * 指定時間帯と重複するキャンセル以外の予約件数を返す
     *
     * @param  int|null  $excludeBookingId  自身を除外する場合のID（update時に使用）
     */
    public function countOverlappingBookings(
        Carbon $startTime,
        Carbon $endTime,
        ?int $excludeBookingId = null
    ): int {
        $query = Booking::where('status', '!=', 'cancelled')
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where('start_time', '<', $endTime)
                    ->where('end_time', '>', $startTime);
            });

        if ($excludeBookingId !== null) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return $query->count();
    }

    /**
     * 指定曜日が店舗の定休日であれば例外をスロー
     *
     * @throws \Exception
     */
    public function checkRegularHoliday(string $dayOfWeek): void
    {
        $settings = Setting::first();
        $regularHolidays = $settings ? ($settings->regular_holidays ?? []) : [];

        if (in_array($dayOfWeek, $regularHolidays, true)) {
            throw new \Exception('指定された日付は店舗の定休日です。', 409);
        }
    }
}
