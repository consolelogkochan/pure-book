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
        Schema::table('settings', function (Blueprint $table) {
            // ルールの種類（'time_based' か 'date_based'）
            $table->string('booking_deadline_type')->default('time_based')->after('close_time');
            
            // パターンA（時間ベース）用のカラム：〇時間前
            $table->integer('booking_deadline_hours')->nullable()->after('booking_deadline_type');
            
            // パターンB（日付ベース）用のカラム：〇日前の、〇時
            $table->integer('booking_deadline_days')->nullable()->after('booking_deadline_hours');
            $table->time('booking_deadline_time')->nullable()->after('booking_deadline_days');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'booking_deadline_type',
                'booking_deadline_hours',
                'booking_deadline_days',
                'booking_deadline_time'
            ]);
        });
    }
};
