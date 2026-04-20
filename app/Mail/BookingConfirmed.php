<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingConfirmed extends Mailable
{
    use Queueable, SerializesModels;

    // テンプレート（Blade）側で $booking として使えるように public にします
    public $booking;

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

    public function attachments(): array
    {
        return [];
    }
}
