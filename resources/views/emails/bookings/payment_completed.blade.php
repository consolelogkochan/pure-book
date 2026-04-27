@component('mail::message')
# 事前決済が完了いたしました

{{ $booking->customer_name }} 様

以下のご予約につきまして、クレジットカードによる事前決済が完了いたしました。

**予約番号:** {{ $booking->booking_reference }}  
**日時:** {{ $booking->start_time->format('Y-m-d H:i') }}  
**メニュー:** {{ $booking->menu->name }}  
**決済金額:** ¥{{ number_format($booking->menu->price) }}

当日のご来店を心よりお待ちしております。
※ご予約の確認やキャンセルは、予約検索画面より【予約番号】と【メールアドレス】にて行えます。

Thanks,<br>
{{ config('app.name') }}
@endcomponent