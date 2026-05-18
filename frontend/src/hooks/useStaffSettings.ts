import { useState, useEffect } from 'react';
import axios from '../axios';
import type { Staff } from '../types';

interface UseStaffSettingsReturn {
  staffs: Staff[];
  isLoading: boolean;
  isSaving: boolean;
  fetchFailed: boolean;
  message: string;
  messageType: 'success' | 'error' | null;
  confirmingStaff: Staff | null;
  isModalOpen: boolean;
  editingStaff: Staff | null;
  fetchStaffs: () => Promise<void>;
  openModal: (staff?: Staff) => void;
  closeModal: () => void;
  requestToggle: (staff: Staff) => void;
  cancelToggle: () => void;
  confirmToggle: () => Promise<void>;
}

export const useStaffSettings = (): UseStaffSettingsReturn => {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [confirmingStaff, setConfirmingStaff] = useState<Staff | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // 純粋な再取得のみ担う。エラー時は throw — 呼び出し元が責務に応じて処理する。
  const fetchStaffs = async () => {
    const res = await axios.get('/admin/staffs');
    setStaffs(res.data);
  };

  // fetchFailed のセットは初回ロード時のみ。
  useEffect(() => {
    fetchStaffs()
      .catch(() => {
        setFetchFailed(true);
        setMessage('データの取得に失敗しました。ページを再読み込みしてください。');
        setMessageType('error');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const openModal = (staff?: Staff) => {
    setMessage('');
    setEditingStaff(staff ?? null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  // Issue 2: メッセージクリアを requestToggle から confirmToggle 実行時に移動。
  // キャンセル時に前の成功メッセージが消えたままになる副作用を解消する。
  const requestToggle = (staff: Staff) => {
    setConfirmingStaff(staff);
  };

  const cancelToggle = () => setConfirmingStaff(null);

  const confirmToggle = async () => {
    if (!confirmingStaff || isSaving) return;
    const target = confirmingStaff;
    // Issue 4: 確認UIを即座に非表示にして連打による二重送信の経路を断つ
    setConfirmingStaff(null);
    setIsSaving(true);
    setMessage(''); // Issue 2
    try {
      await axios.patch(`/admin/staffs/${target.id}/toggle-status`, {}, {
        headers: { Accept: 'application/json' },
      });
      await fetchStaffs().catch(() => {});
      setMessage(`「${target.name}」のステータスを変更しました`);
      setMessageType('success');
    } catch (error) {
      setMessage('ステータスの変更に失敗しました。通信環境をご確認ください。');
      setMessageType('error');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    staffs, isLoading, isSaving, fetchFailed,
    message, messageType,
    confirmingStaff, isModalOpen, editingStaff,
    fetchStaffs, openModal, closeModal,
    requestToggle, cancelToggle, confirmToggle,
  };
};
