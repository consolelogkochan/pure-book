<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // ログインしていない、または role が admin ではない場合は 403 (Forbidden) を返す
        if (! auth()->check() || auth()->user()->role !== 'admin') {
            return response()->json([
                'message' => '管理者権限がありません。',
            ], 403);
        }

        // チェックを通過したら、次の処理（コントローラー）へ進ませる
        return $next($request);
    }
}
