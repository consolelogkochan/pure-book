<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Setting;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingService
{
    /**
     * 指定曜日に出勤している有効なスタッフを悲観的ロック付きで取得する
     *
     * 【重要】このメソッドは必ず DB::transaction() 内から呼び出すこと。
     * lockForUpdate() はトランザクション外では悲観的ロックとして機能しない。
     *
     * @return Collection<int, Staff>
     *
     * @throws \LogicException トランザクション外から呼び出された場合
     */
    public function getAvailableStaffs(string $dayOfWeek, ?int $requestedStaffId = null): Collection
    {
        if (DB::transactionLevel() === 0) {
            throw new \LogicException('getAvailableStaffs() must be called within a DB transaction.');
        }

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
     * 店舗設定を取得する。レコードが存在しない場合は初期値で作成して返す
     */
    public function getOrCreateSettings(): Setting
    {
        return Setting::firstOrCreate(
            ['id' => 1],
            [
                'open_time' => '10:00:00',
                'close_time' => '20:00:00',
                'regular_holidays' => [],
                'terms_text' => "当サロンのご利用にあたり、以下の規約にご同意ください。\n\n1. キャンセルについて...",
                'booking_deadline_type' => 'time_based',
                'booking_deadline_hours' => 2,
                'booking_deadline_days' => 1,
                'booking_deadline_time' => '17:00:00',
                'cancel_deadline_hours' => 24,
            ]
        );
    }

    /**
     * 指定曜日が店舗の定休日かどうかを返す
     *
     * 定休日設定は60秒キャッシュして DB クエリを削減する。
     * 設定変更時は 'store_settings.regular_holidays' キーを削除すること。
     */
    public function isRegularHoliday(string $dayOfWeek): bool
    {
        /** @var array<int, string> $regularHolidays */
        $regularHolidays = Cache::remember('store_settings.regular_holidays', 60, function () {
            $settings = Setting::first();

            return $settings ? ($settings->regular_holidays ?? []) : [];
        });

        return in_array($dayOfWeek, $regularHolidays, true);
    }

    /**
     * 指定曜日が店舗の定休日であれば例外をスロー
     *
     * @throws \Exception
     */
    public function checkRegularHoliday(string $dayOfWeek): void
    {
        if ($this->isRegularHoliday($dayOfWeek)) {
            throw new \Exception('指定された日付は店舗の定休日です。', 409);
        }
    }

    /**
     * 指定曜日に出勤している有効なスタッフ数を返す
     *
     * getAvailableStaffs() と異なりトランザクション不要・ロックなし。
     */
    public function getAvailableStaffCount(string $dayOfWeek): int
    {
        return Staff::where('is_active', true)
            ->whereHas('schedule', function ($q) use ($dayOfWeek) {
                $q->where($dayOfWeek, true);
            })
            ->count();
    }

    /**
     * 指定曜日に出勤している有効なスタッフの ID 一覧を返す
     *
     * getAvailableStaffCount() と同一条件。count が必要な場合は count() で取得すること。
     *
     * @return array<int, int>
     */
    public function getAvailableStaffIds(string $dayOfWeek): array
    {
        return Staff::where('is_active', true)
            ->whereHas('schedule', function ($q) use ($dayOfWeek) {
                $q->where($dayOfWeek, true);
            })
            ->pluck('id')
            ->all();
    }

    /**
     * 指定日・指定スタッフのキャンセル以外の予約一覧を返す
     *
     * staffIds を渡すことでシフト変更後の非出勤スタッフの予約を除外し、
     * 空き枠計算の過剰カウントを防ぐ。
     *
     * @param  array<int, int>  $staffIds
     * @return Collection<int, Booking>
     */
    public function getBookingsOnDate(Carbon $date, array $staffIds = []): Collection
    {
        $query = Booking::whereDate('start_time', $date->format('Y-m-d'))
            ->where('status', '!=', 'cancelled');

        if (! empty($staffIds)) {
            $query->whereIn('staff_id', $staffIds);
        }

        return $query->get();
    }

    /**
     * 日付ベース設定での予約受付締切を過ぎているか判定する
     *
     * 締切 = targetDate の booking_deadline_days 日前の booking_deadline_time
     */
    public function isBookingDeadlinePassed(Carbon $targetDate, Setting $settings): bool
    {
        $deadlineDays = $settings->booking_deadline_days ?? 1;
        $deadlineTime = $settings->booking_deadline_time ?? '17:00:00';

        $bookingDeadline = $targetDate->copy()
            ->subDays((int) $deadlineDays)
            ->setTimeFromTimeString((string) $deadlineTime);

        return Carbon::now()->gt($bookingDeadline);
    }

    /**
     * 時間ベース設定での指定スロットがまだ予約受付可能か判定する
     *
     * スロット開始時刻の booking_deadline_hours 時間前を期限とする。
     */
    public function isSlotWithinDeadline(Carbon $slotTime, Setting $settings): bool
    {
        $deadlineHours = $settings->booking_deadline_hours ?? 2;
        $slotDeadline = $slotTime->copy()->subHours((int) $deadlineHours);

        return Carbon::now()->lte($slotDeadline);
    }

    /**
     * 30分刻みで空きスロットの開始時刻一覧を計算して返す
     *
     * @param  Collection<int, Booking>  $bookings
     * @return array<int, string>
     */
    public function calculateAvailableSlots(
        Carbon $targetDate,
        int $durationMinutes,
        Setting $settings,
        int $staffCount,
        Collection $bookings
    ): array {
        $openTime = $targetDate->copy()->setTimeFromTimeString((string) $settings->open_time);
        $closeTime = $targetDate->copy()->setTimeFromTimeString((string) $settings->close_time);
        $isTimeBased = $settings->booking_deadline_type === 'time_based';

        $availableSlots = [];
        $currentTime = $openTime->copy();

        while ($currentTime < $closeTime) {
            $endTime = $currentTime->copy()->addMinutes($durationMinutes);

            if ($endTime <= $closeTime) {
                $isValidSlot = $isTimeBased
                    ? $this->isSlotWithinDeadline($currentTime, $settings)
                    : true;

                if ($isValidSlot) {
                    $overlappingCount = $bookings->filter(function ($booking) use ($currentTime, $endTime) {
                        return $booking->start_time->lt($endTime)
                            && $booking->end_time->gt($currentTime);
                    })->count();

                    if ($overlappingCount < $staffCount) {
                        $availableSlots[] = $currentTime->format('H:i');
                    }
                }
            }

            $currentTime->addMinutes(30);
        }

        return $availableSlots;
    }

    /**
     * 開始時刻とメニュー所要時間から終了時刻を計算する
     */
    public function calculateEndTime(Carbon $startTime, int $durationMinutes): Carbon
    {
        return $startTime->copy()->addMinutes($durationMinutes);
    }

    /**
     * Carbon インスタンスから小文字の曜日名（例: 'monday'）を返す
     */
    public function extractDayOfWeek(Carbon $startTime): string
    {
        return strtolower($startTime->englishDayOfWeek);
    }

    /**
     * 指定スタッフ群の中で時間帯が重複するキャンセル以外の予約を返す
     *
     * @param  Collection<int, Staff>  $availableStaffs
     * @return Collection<int, Booking>
     */
    public function findOverlappingBookingsByStaffs(
        Collection $availableStaffs,
        Carbon $startTime,
        Carbon $endTime
    ): Collection {
        $staffIds = $availableStaffs->pluck('id');

        return Booking::whereIn('staff_id', $staffIds)
            ->where('status', '!=', 'cancelled')
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where('start_time', '<', $endTime)
                    ->where('end_time', '>', $startTime);
            })
            ->get();
    }

    /**
     * 重複予約がない最初のスタッフを割り当てて返す
     *
     * @param  Collection<int, Staff>  $availableStaffs
     * @param  Collection<int, Booking>  $overlappingBookings
     *
     * @throws \Exception 空きスタッフが存在しない場合
     */
    public function assignStaff(Collection $availableStaffs, Collection $overlappingBookings): Staff
    {
        foreach ($availableStaffs as $staff) {
            if ($overlappingBookings->where('staff_id', $staff->id)->isEmpty()) {
                return $staff;
            }
        }

        throw new \Exception('申し訳ありません。タッチの差で予約が埋まってしまいました。');
    }

    /**
     * "BKG-" プレフィックス付きのランダムな予約番号を生成する
     *
     * DB に存在しない番号が生成されるまで最大5回リトライする。
     *
     * @throws \RuntimeException 5回試みても衝突が解消しない場合
     */
    public function generateBookingReference(): string
    {
        for ($i = 0; $i < 5; $i++) {
            $reference = 'BKG-'.strtoupper(Str::random(8));
            if (! Booking::where('booking_reference', $reference)->exists()) {
                return $reference;
            }
        }

        throw new \RuntimeException('予約番号の生成に失敗しました。しばらく時間をおいて再度お試しください。');
    }

    /**
     * 予約レコードを作成して返す
     *
     * @param  array<string, mixed>  $data
     */
    public function createBooking(array $data): Booking
    {
        return Booking::create($data);
    }

    /**
     * キャンセル期限を過ぎている場合は例外をスロー
     *
     * キャンセル期限時間数は Settings テーブルから取得し60秒キャッシュする。
     * 設定変更時は 'store_settings.cancel_deadline_hours' キーを削除すること。
     *
     * @throws \Exception
     */
    public function checkCancelDeadline(Booking $booking): void
    {
        /** @var int $hours */
        $hours = Cache::remember('store_settings.cancel_deadline_hours', 60, function () {
            $settings = Setting::first();

            return $settings ? ($settings->cancel_deadline_hours ?? 24) : 24;
        });

        $cancelDeadline = Carbon::parse((string) $booking->start_time)->subHours($hours);

        if (Carbon::now()->gt($cancelDeadline)) {
            throw new \Exception(
                "キャンセル期限（予約の{$hours}時間前）を過ぎているため、システムからのキャンセルはできません。店舗へ直接お電話ください。",
                403
            );
        }
    }

    /**
     * アンケート回答を "質問: 回答 / 質問: 回答" 形式のテキストに変換する
     */
    public function formatSurveyResponsesAsText(mixed $responses): string
    {
        if (is_string($responses)) {
            $responses = json_decode($responses, true);
        }

        if (! is_array($responses)) {
            return '';
        }

        $surveys = [];
        foreach ($responses as $question => $answer) {
            $answerText = is_array($answer)
                ? implode(', ', array_map(fn (mixed $v): string => (string) $v, $answer))
                : (string) $answer;
            $surveys[] = $question.': '.$answerText;
        }

        return implode(' / ', $surveys);
    }

    /**
     * 決済ステータスを日本語テキストに変換する
     */
    public function formatPaymentStatus(string $paymentStatus): string
    {
        return match ($paymentStatus) {
            'paid' => '事前決済済',
            'refunded' => '返金済',
            default => '未決済',
        };
    }
}
