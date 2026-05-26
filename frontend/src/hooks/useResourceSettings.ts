import { useState, useEffect } from 'react';
import axios from '../axios';
import type { Staff, StaffSchedule } from '../types';

const DEFAULT_SCHEDULE: StaffSchedule = {
  monday: true, tuesday: true, wednesday: true,
  thursday: true, friday: true, saturday: true, sunday: true,
};

interface UseResourceSettingsReturn {
  staffs: Staff[];
  isLoading: boolean;
  isSaving: boolean;
  fetchFailed: boolean;
  message: string;
  messageType: 'success' | 'error' | null;
  handleScheduleChange: (staffId: number, dayKey: keyof StaffSchedule, value: boolean) => void;
  handleBulkSave: () => Promise<void>;
}

export const useResourceSettings = (): UseResourceSettingsReturn => {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  // 純粋な再取得のみ担う。エラー時は throw — 呼び出し元が責務に応じて処理する。
  const fetchResources = async () => {
    const res = await axios.get('/admin/resources');
    const formattedData = res.data.map((staff: Staff) => ({
      ...staff,
      schedule: staff.schedule || DEFAULT_SCHEDULE,
    }));
    setStaffs(formattedData);
  };

  // fetchFailed のセットは初回ロード時のみ。保存後の再取得失敗は fetchFailed を汚染しない。
  useEffect(() => {
    fetchResources()
      .catch(() => {
        setFetchFailed(true);
        setMessage('データの取得に失敗しました。ページを再読み込みしてください。');
        setMessageType('error');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleScheduleChange = (staffId: number, dayKey: keyof StaffSchedule, value: boolean) => {
    setMessage('');
    setStaffs(prev => prev.map(staff => {
      if (staff.id !== staffId || !staff.schedule) return staff;
      return {
        ...staff,
        schedule: { ...staff.schedule, [dayKey]: value },
      };
    }));
  };

  const handleBulkSave = async () => {
    if (isSaving || fetchFailed) return;
    setIsSaving(true);
    setMessage('');
    try {
      // シフト管理に必要な id と schedule のみ送信（不要なフィールドを除外）
      const payload = staffs.map(s => ({ id: s.id, schedule: s.schedule }));
      await axios.post('/admin/resources/bulk', payload, {
        headers: { Accept: 'application/json' },
      });
      // 保存後の再取得失敗は無視し、fetchFailed を汚染しない
      await fetchResources().catch(() => {});
      setMessage('シフトを一括保存しました');
      setMessageType('success');
    } catch (error) {
      setMessage('保存に失敗しました。通信環境をご確認ください。');
      setMessageType('error');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return { staffs, isLoading, isSaving, fetchFailed, message, messageType, handleScheduleChange, handleBulkSave };
};
