import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from '../axios';

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

// Contextで提供する値の型を定義
interface AuthContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    loading: boolean;
}

// 初期値を undefined にして生成（後で安全にフックを使うため）
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// children の型を定義
interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
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
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    // Providerの外でこのフックが呼ばれた場合の安全対策
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};