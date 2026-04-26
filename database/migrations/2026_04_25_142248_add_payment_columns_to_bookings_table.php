<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // 支払いステータス (unpaid:未払い, paid:支払い済み, refunded:返金済み)
            $table->string('payment_status')->default('unpaid')->after('status');
            // Stripeの決済ID (返金時に必須)
            $table->string('stripe_payment_intent_id')->nullable()->after('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'stripe_payment_intent_id']);
        });
    }
};
