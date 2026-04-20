<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingCancelled extends Mailable
{
    use Queueable, SerializesModels;

    public $booking;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking->load(['menu']);
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

    public function attachments(): array
    {
        return [];
    }
}
