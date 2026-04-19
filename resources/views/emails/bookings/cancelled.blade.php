@component('mail::message')
# ご予約のキャンセルを承りました

{{ $booking->customer_name }} 様

以下のご予約のキャンセル手続きが完了いたしました。

**予約番号:** {{ $booking->booking_reference }}  
**日時:** {{ $booking->start_time->format('Y-m-d H:i') }}  
**メニュー:** {{ $booking->menu->name }}  

またのご利用を心よりお待ちしております。

Thanks,<br>
{{ config('app.name') }}
@endcomponent