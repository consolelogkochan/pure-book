<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingCancelled extends Mailable
{
    use Queueable, SerializesModels;

    public Booking $booking;

    public string $paymentStatus;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking->load(['menu']);
        // 💡 コンストラクタ（メモリ上にある時）で、現在のステータスをコピーしておく
        $this->paymentStatus = $booking->payment_status;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '【キャンセル完了】予約の取り消しを受け付けました',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.bookings.cancelled',
        );
    }

    // メソッドの上に注釈（PHPDoc）を追加して、配列の中身の型を教える
    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
