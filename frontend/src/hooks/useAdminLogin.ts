import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import axios from '../axios';
import { useAuth } from '../contexts/AuthContext';
import type { LoginFormData } from '../types';

interface UseAdminLoginReturn {
  form: UseFormReturn<LoginFormData>;
  isLoading: boolean;
  errorMessage: string;
  handleLogin: (data: LoginFormData) => Promise<void>;
  clearError: () => void;
}

export const useAdminLogin = (): UseAdminLoginReturn => {
  const form = useForm<LoginFormData>();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const { watch } = form;
  useEffect(() => {
    const subscription = watch(() => setErrorMessage(''));
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleLogin = async (data: LoginFormData) => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      await axios.get((import.meta.env.VITE_APP_URL ?? 'http://localhost') + '/sanctum/csrf-cookie');
      await axios.post('/admin/login', data);
      const userResponse = await axios.get('/user');

      setUser(userResponse.data);
      navigate('/admin/calendar');
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        if (error.response?.status === 429) {
          setErrorMessage('アクセスが集中しているか、操作が早すぎます。1分ほどお待ちいただいてから再度お試しください。');
        } else if (error.response?.status === 401 || error.response?.status === 403) {
          setErrorMessage(error.response.data?.message || '認証に失敗しました。');
        } else {
          setErrorMessage('ログインに失敗しました。通信環境をご確認ください。');
        }
      } else {
        setErrorMessage('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setErrorMessage('');

  return { form, isLoading, errorMessage, handleLogin, clearError };
};
