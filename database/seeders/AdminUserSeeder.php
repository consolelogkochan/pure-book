<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // updateOrCreateを使うと、何度実行してもデータが重複しません
        User::updateOrCreate(
            ['email' => 'admin@example.com'], // 検索条件
            [
                'name' => 'システム管理者',
                'password' => Hash::make('password123'), // 本番環境ではより強固なパスワードに
                'role' => 'admin',
            ]
        );
    }
}
