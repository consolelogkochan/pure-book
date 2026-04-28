import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../axios';
import { useAuth } from '../../contexts/AuthContext';
import { isAxiosError } from 'axios';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { setUser } = useAuth();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        try {
            // 1. まずはCSRFトークンを取得（挨拶）
            await axios.get('/sanctum/csrf-cookie');

            // 2. ログインを実行（本番）
            const response = await axios.post('/api/admin/login', {
                email,
                password,
            });

            // Laravelのログイン成功直後に、ユーザー情報を取得してReactの記憶を更新する
            const userResponse = await axios.get('/api/user');
            setUser(userResponse.data);

            // ログイン成功時の処理
            alert(response.data.message);
            // ローカルストレージ等にユーザー情報を保存（必要に応じて）
            localStorage.setItem('adminUser', JSON.stringify(response.data.user || userResponse.data));
            
            // 管理者のダッシュボードへ遷移
            navigate('/admin/calendar'); 

        } catch (error: any) {
            // ▼ 追加：429エラー（レートリミット）のハンドリング
            if (error.response && error.response.status === 429) {
                alert('アクセスが集中しているか、操作が早すぎます。1分ほどお待ちいただいてから再度お試しください。');
                return;
            }
            // エラーがAxiosのエラーであるか（ネットワークエラー等ではないか）を厳格にチェック
            if (isAxiosError(error)) {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    // サーバーからのエラーメッセージ、またはデフォルトのメッセージをセット
                    setError(error.response.data?.message || '認証に失敗しました。');
                } else {
                    setError('ログインに失敗しました。通信環境をご確認ください。');
                }
            } else {
                setError('予期せぬエラーが発生しました。');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    管理者ログイン
                </h2>
                
                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    {/* パスワード入力欄のUI */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">パスワード</label>
                        {/* relativeで親要素を基準点にする */}
                        <div className="relative mt-1"> 
                            <input
                                // showPasswordがtrueならtext、falseならpassword
                                type={showPassword ? "text" : "password"}
                                required
                                // pr-10 で右側にアイコン用の余白（Padding Right）を確保
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {/* absoluteで右端にボタンを絶対配置 */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? (
                                    // 目のアイコン（斜線あり / 非表示にする）
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.41-3.41" />
                                    </svg>
                                ) : (
                                    // 目のアイコン（斜線なし / 表示にする）
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
                    >
                        ログイン
                    </button>
                </form>
            </div>
        </div>
    );
}