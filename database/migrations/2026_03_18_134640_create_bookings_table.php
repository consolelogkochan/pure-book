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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_reference')->unique(); // 予約番号
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // ゲスト予約許容
            $table->foreignId('staff_id')->constrained();
            $table->foreignId('menu_id')->constrained();
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            $table->text('customer_memo')->nullable();
            $table->json('survey_responses')->nullable();
            $table->string('status')->default('pending'); // pending, confirmed, cancelled
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
