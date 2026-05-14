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

interface UseHoursSettingsReturn {
  form: UseFormReturn<StoreSetting>;
  isLoading: boolean;
  isSaving: boolean;
  message: string;
  messageType: 'success' | 'error' | null;
  toggleHoliday: (dayKey: string) => void;
  isHoliday: (dayKey: string) => boolean;
  saveSettings: () => Promise<void>;
}

export const useHoursSettings = (): UseHoursSettingsReturn => {
  const form = useForm<StoreSetting>({ defaultValues: DEFAULT_SETTINGS });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  const { reset, getValues, setValue, watch } = form;
  const watchedHolidays = watch('regular_holidays');

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

  const toggleHoliday = (dayKey: string) => {
    const current = getValues('regular_holidays');
    const updated = current.includes(dayKey)
      ? current.filter(d => d !== dayKey)
      : [...current, dayKey];
    setValue('regular_holidays', updated);
  };

  const isHoliday = (dayKey: string) => watchedHolidays.includes(dayKey);

  const saveSettings = async () => {
    if (isSaving) return;

    const { open_time, close_time } = getValues();
    if (open_time >= close_time) {
      setMessage('閉店時間は開店時間より後に設定してください。');
      setMessageType('error');
      return;
    }

    setIsSaving(true);
    try {
      await axios.put('/admin/settings', getValues(), {
        headers: { Accept: 'application/json' },
      });
      setMessage('店舗設定を保存しました');
      setMessageType('success');
    } catch (error) {
      setMessage('保存に失敗しました。通信環境をご確認ください。');
      setMessageType('error');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return { form, isLoading, isSaving, message, messageType, toggleHoliday, isHoliday, saveSettings };
};
