<?php

namespace App\Exports;

use App\Models\Booking;
use App\Models\Menu;
use App\Services\BookingService;
use Illuminate\Support\Carbon;

class BookingCsvExporter
{
    public function __construct(private BookingService $bookingService) {}

    /**
     * @return string[]
     */
    public function headers(): array
    {
        return ['予約番号', '予約日時', 'お名前', '電話番号', 'メール', 'メニュー', 'ステータス', '決済ステータス', '店舗メモ', 'アンケート回答'];
    }

    /**
     * @return string[]
     */
    public function buildRow(Booking $booking): array
    {
        /** @var Menu|null $menu */
        $menu = $booking->menu;
        $menuName = $menu ? $menu->name : '';

        return [
            (string) $booking->booking_reference,
            $this->formatStartTime((string) $booking->start_time),
            (string) $booking->customer_name,
            (string) $booking->customer_phone,
            (string) $booking->customer_email,
            $menuName,
            $booking->status === 'cancelled' ? 'キャンセル' : '予約確定',
            $this->bookingService->formatPaymentStatus((string) $booking->payment_status),
            (string) $booking->customer_memo,
            $this->bookingService->formatSurveyResponsesAsText($booking->survey_responses),
        ];
    }

    protected function formatStartTime(string $startTime): string
    {
        return Carbon::parse($startTime)->format('Y-m-d H:i');
    }
}
