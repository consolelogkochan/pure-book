<?php

namespace App\Services;

use Stripe\PaymentIntent;
use Stripe\StripeClient;

class StripeService
{
    protected StripeClient $stripe;

    public function __construct()
    {
        $this->stripe = new StripeClient(config('services.stripe.secret'));
    }

    /**
     * PaymentIntentを生成し、フロントエンドに渡すclientSecretを取得する
     *
     * @param  array<string, string>  $metadata
     */
    public function createPaymentIntent(int $amount, array $metadata): PaymentIntent
    {
        return $this->stripe->paymentIntents->create([
            'amount' => $amount,
            'currency' => 'jpy',
            'metadata' => $metadata,
        ]);
    }

    /**
     * PaymentIntentを取得して決済ステータスを検証する
     */
    public function retrievePaymentIntent(string $paymentIntentId): PaymentIntent
    {
        return $this->stripe->paymentIntents->retrieve($paymentIntentId);
    }

    /**
     * 返金処理を実行する。失敗時はControllerでキャッチできるよう例外を再スロー
     */
    public function refund(string $paymentIntentId): void
    {
        try {
            $this->stripe->refunds->create([
                'payment_intent' => $paymentIntentId,
            ]);
        } catch (\Exception $e) {
            throw new \Exception('Stripeでの返金処理に失敗しました: '.$e->getMessage());
        }
    }
}
