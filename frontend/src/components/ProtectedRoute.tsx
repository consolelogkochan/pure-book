import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
    const { user, loading } = useAuth();

    // ログイン状態を確認中の場合は、ローディング画面を表示
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-gray-500 font-bold">認証情報を確認中...</div>
            </div>
        );
    }

    // 未ログイン、または権限が「admin」ではない場合はログイン画面へ強制送還
    if (!user || user.role !== 'admin') {
        return <Navigate to="/admin/login" replace />;
    }

    // 問題なければ、目的の画面（子ルート）を表示する
    return <Outlet />;
}