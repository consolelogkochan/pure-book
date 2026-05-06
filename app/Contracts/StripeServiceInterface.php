<?php

namespace App\Contracts;

use Stripe\PaymentIntent;

interface StripeServiceInterface
{
    /**
     * @param  array<string, string>  $metadata
     */
    public function createPaymentIntent(int $amount, array $metadata): PaymentIntent;

    public function retrievePaymentIntent(string $paymentIntentId): PaymentIntent;

    public function refund(string $paymentIntentId): void;
}
