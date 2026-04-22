<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Auth::attempt でメールとパスワードが一致するかチェック
        if (Auth::attempt($credentials)) {
            // セッションハイジャック対策
            $request->session()->regenerate();

            /** @var User $user */
            $user = Auth::user();

            // 今回は管理者用ログインなので、admin以外は追い出す
            if ($user->role !== 'admin') {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return response()->json([
                    'message' => '管理者権限がありません。',
                ], 403);
            }

            return response()->json([
                'message' => 'ログインに成功しました。',
                'user' => $user,
            ]);
        }

        // 一致しなかった場合
        return response()->json([
            'message' => 'メールアドレスまたはパスワードが間違っています。',
        ], 401);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'ログアウトしました。',
        ]);
    }
}
