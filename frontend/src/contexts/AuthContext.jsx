import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    // 初期状態は「確認中（ローディング）」にする
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Laravelにログイン状態を確認する（Sanctumの標準API）
                const res = await axios.get('/api/user');
                setUser(res.data);
            } catch (error) {
                // 401エラー（未ログイン）などの場合はnullにする
                setUser(null);
            } finally {
                // 確認が終わったらローディングを解除
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// 他のコンポーネントから簡単に呼び出せるようにするカスタムフック
export const useAuth = () => useContext(AuthContext);