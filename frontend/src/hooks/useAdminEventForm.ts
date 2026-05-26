import { useState, useEffect, useRef } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { isAxiosError } from 'axios';
import axiosInstance from '../axios';
import type { Booking } from '../types';

export type SelectedBooking = { isNew: boolean } & Partial<Booking>;

export interface AdminEventFormData {
  start_date_only: string;
  start_time_only: string;
  menu_id: number;
  status: 'confirmed' | 'cancelled';
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_memo: string;
}

interface UseAdminEventFormProps {
  selectedBooking: SelectedBooking;
  onSuccess: () => void;
}

interface UseAdminEventFormReturn {
  form: UseFormReturn<AdminEventFormData>;
  onSubmit: (data: AdminEventFormData) => Promise<void>;
  message: string;
  messageType: 'success' | 'error' | null;
}

const extractDate = (startTime: string | undefined): string => {
  if (!startTime) return '';
  return startTime.substring(0, 10);
};

const extractTime = (startTime: string | undefined): string => {
  if (!startTime) return '';
  return new Date(startTime).toTimeString().substring(0, 5);
};

export const useAdminEventForm = ({
  selectedBooking,
  onSuccess,
}: UseAdminEventFormProps): UseAdminEventFormReturn => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<AdminEventFormData>({
    defaultValues: {
      start_date_only: extractDate(selectedBooking.start_time),
      start_time_only: extractTime(selectedBooking.start_time),
      menu_id: selectedBooking.menu_id,
      status: (selectedBooking.status as 'confirmed' | 'cancelled') ?? 'confirmed',
      customer_name: selectedBooking.customer_name ?? '',
      customer_phone: selectedBooking.customer_phone ?? '',
      customer_email: selectedBooking.customer_email ?? '',
      customer_memo: selectedBooking.customer_memo ?? '',
    },
  });

  // unmount 時に成功タイマーをキャンセル（ドロワーを早期に閉じた場合の二重呼び出し防止）
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const { watch } = form;
  // message と messageType を両方リセット（片方だけ残ると次の成功バナーが誤色になる）
  useEffect(() => {
    const subscription = watch(() => {
      setMessage('');
      setMessageType(null);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const onSubmit = async (data: AdminEventFormData): Promise<void> => {
    setMessage('');
    setMessageType(null);
    const payload = {
      start_time: `${data.start_date_only} ${data.start_time_only}:00`,
      menu_id: data.menu_id,
      status: data.status,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email,
      customer_memo: data.customer_memo,
    };

    try {
      if (selectedBooking.isNew) {
        await axiosInstance.post('/admin/bookings', payload);
      } else {
        await axiosInstance.put(`/admin/bookings/${selectedBooking.id}`, payload);
      }
      // 成功バナーを一瞬表示してからドロワーを閉じる
      const successMessage = selectedBooking.isNew ? '新規予約を登録しました' : '予約情報を更新しました';
      setMessage(successMessage);
      setMessageType('success');
      successTimerRef.current = setTimeout(onSuccess, 900);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('保存に失敗しました。通信環境をご確認ください。');
      }
      setMessageType('error');
    }
  };

  return { form, onSubmit, message, messageType };
};
