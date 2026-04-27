@component('mail::message')
# ご予約のキャンセルを承りました

{{ $booking->customer_name }} 様

以下のご予約のキャンセル手続きが完了いたしました。

**予約番号:** {{ $booking->booking_reference }}  
**日時:** {{ $booking->start_time->format('Y-m-d H:i') }}  
**メニュー:** {{ $booking->menu->name }}  

@if($paymentStatus === 'refunded')
---
**【ご返金について】**
事前決済いただいていた料金につきましては、ご利用のクレジットカードへ全額返金処理を実行いたしました。
※カード会社により、明細への反映や実際の返金までに数日〜数週間かかる場合がございます。詳細はご利用のカード会社へお問い合わせください。
@endif

またのご利用を心よりお待ちしております。

Thanks,<br>
{{ config('app.name') }}
@endcomponent