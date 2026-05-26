<?php

namespace App\Exports;

use App\Models\Booking;
use App\Models\Menu;
use Illuminate\Support\Carbon;

class BookingCsvExporter
{
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
            $this->formatPaymentStatus((string) $booking->payment_status),
            (string) $booking->customer_memo,
            $this->formatSurveyResponsesAsText($booking->survey_responses),
        ];
    }

    private function formatStartTime(string $startTime): string
    {
        return Carbon::parse($startTime)->format('Y-m-d H:i');
    }

    private function formatPaymentStatus(string $paymentStatus): string
    {
        return match ($paymentStatus) {
            'paid' => '事前決済済',
            'refunded' => '返金済',
            default => '未決済',
        };
    }

    private function formatSurveyResponsesAsText(mixed $responses): string
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
}
