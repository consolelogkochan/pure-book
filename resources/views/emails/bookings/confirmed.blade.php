@component('mail::message')
# ご予約が確定しました

{{ $booking->customer_name }} 様

この度はご予約いただきありがとうございます。
以下の内容で予約を承りました。

**予約番号:** {{ $booking->booking_reference }}  
**日時:** {{ $booking->start_time->format('Y-m-d H:i') }}  
**メニュー:** {{ $booking->menu->name }}  

予約の確認・キャンセルは以下のURLより行えます。

@component('mail::button', ['url' => config('app.frontend_url') . '/search'])
予約照会画面へ
@endcomponent

※キャンセルの受付は予約の24時間前までとなります。

Thanks,<br>
{{ config('app.name') }}
@endcomponent