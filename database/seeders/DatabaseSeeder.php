<?php

namespace Database\Seeders;

use App\Models\Menu; // 追加
use App\Models\Staff; // 追加
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // スタッフを5人作成
        Staff::factory(5)->create();

        // メニューを10個作成
        Menu::factory(10)->create();
    }
}
