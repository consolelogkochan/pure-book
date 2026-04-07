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
        Schema::create('settings', function (Blueprint $table) {
            $table->id(); // 常に id=1 のみが使われます
            
            // 営業時間（時間型）
            $table->time('open_time')->default('10:00:00');
            $table->time('close_time')->default('20:00:00');
            
            // 定休日（複数選べるようにJSON型で保存）例: ["tuesday", "wednesday"]
            $table->json('regular_holidays')->nullable();
            
            // 利用規約（長文が入るのでtext型）
            $table->text('terms_text')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
