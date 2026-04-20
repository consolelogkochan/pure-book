<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingConfirmed extends Mailable
{
    use Queueable, SerializesModels;

    // テンプレート（Blade）側で $booking として使えるように public にします
    public Booking $booking;

    public function __construct(Booking $booking)
    {
        // メニュー名なども表示するため load しておきます
        $this->booking = $booking->load(['menu']);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '【予約完了】ご予約ありがとうございます',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.bookings.confirmed',
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
