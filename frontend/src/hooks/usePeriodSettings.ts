import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import axios from '../axios';
import type { StoreSetting } from '../types';

const DEFAULT_SETTINGS: StoreSetting = {
  open_time: '10:00',
  close_time: '20:00',
  regular_holidays: [],
  terms_text: '',
  booking_deadline_type: 'time_based',
  booking_deadline_hours: 2,
  booking_deadline_days: 1,
  booking_deadline_time: '17:00',
  cancel_deadline_hours: 24,
};

const trimSeconds = (time: string) => time.substring(0, 5);

interface UsePeriodSettingsReturn {
  form: UseFormReturn<StoreSetting>;
  isLoading: boolean;
  isSaving: boolean;
  fetchFailed: boolean;
  message: string;
  messageType: 'success' | 'error' | null;
  saveSettings: () => Promise<void>;
}

export const usePeriodSettings = (): UsePeriodSettingsReturn => {
  const form = useForm<StoreSetting>({ defaultValues: DEFAULT_SETTINGS });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false); // Issue 4
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  const { reset, getValues, watch } = form;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/admin/settings');
        reset({
          open_time: trimSeconds(res.data.open_time),
          close_time: trimSeconds(res.data.close_time),
          regular_holidays: res.data.regular_holidays || [],
          terms_text: res.data.terms_text || '',
          booking_deadline_type: res.data.booking_deadline_type || 'time_based',
          booking_deadline_hours: res.data.booking_deadline_hours ?? 2,
          booking_deadline_days: res.data.booking_deadline_days ?? 1,
          booking_deadline_time: res.data.booking_deadline_time
            ? trimSeconds(res.data.booking_deadline_time)
            : '17:00',
          cancel_deadline_hours: res.data.cancel_deadline_hours ?? 24,
        });
      } catch (error) {
        console.error('設定の取得に失敗しました', error);
        setFetchFailed(true); // Issue 4: フェッチ失敗を記録して保存を封じる
        setMessage('設定の取得に失敗しました。ページを再読み込みしてください。');
        setMessageType('error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [reset]);

  useEffect(() => {
    const subscription = watch(() => setMessage(''));
    return () => subscription.unsubscribe();
  }, [watch]);

  const saveSettings = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Issue 5: 保存直前に最新値を取得し、他ページの変更を保持したままマージして送信
      const latest = await axios.get('/admin/settings');
      const {
        booking_deadline_type,
        booking_deadline_hours,
        booking_deadline_days,
        booking_deadline_time,
        cancel_deadline_hours,
      } = getValues();

      await axios.put('/admin/settings', {
        ...latest.data,
        booking_deadline_type,
        booking_deadline_hours,
        booking_deadline_days,
        booking_deadline_time,
        cancel_deadline_hours,
      }, {
        headers: { Accept: 'application/json' },
      });

      setMessage('予約受付ルールを保存しました');
      setMessageType('success');
    } catch (error) {
      setMessage('保存に失敗しました。通信環境をご確認ください。');
      setMessageType('error');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return { form, isLoading, isSaving, fetchFailed, message, messageType, saveSettings };
};
