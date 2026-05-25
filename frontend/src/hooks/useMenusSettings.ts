import { useState, useEffect } from 'react';
import axios from '../axios';
import type { Menu } from '../types';

interface UseMenusSettingsReturn {
  menus: Menu[];
  isLoading: boolean;
  isSaving: boolean;
  fetchFailed: boolean;
  isMenuModalOpen: boolean;
  editingMenu: Menu | null;
  confirmingMenu: Menu | null;
  message: string;
  messageType: 'success' | 'error' | null;
  fetchMenus: () => Promise<void>;
  openModal: (menu?: Menu) => void;
  closeModal: () => void;
  requestToggle: (menu: Menu) => void;
  confirmToggle: () => Promise<void>;
  cancelToggle: () => void;
}

export const useMenusSettings = (): UseMenusSettingsReturn => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [confirmingMenu, setConfirmingMenu] = useState<Menu | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  // 純粋な再取得のみ担う。エラー時は throw — 呼び出し元が責務に応じて処理する。
  const fetchMenus = async () => {
    const res = await axios.get('/admin/menus');
    setMenus(res.data);
  };

  // fetchFailed のセットは初回ロード時のみ。
  useEffect(() => {
    fetchMenus()
      .catch(() => {
        setFetchFailed(true);
        setMessage('データの取得に失敗しました。ページを再読み込みしてください。');
        setMessageType('error');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const openModal = (menu?: Menu) => {
    setMessage('');
    setEditingMenu(menu ?? null);
    setIsMenuModalOpen(true);
  };

  const closeModal = () => {
    setIsMenuModalOpen(false);
    setEditingMenu(null);
  };

  const requestToggle = (menu: Menu) => {
    setConfirmingMenu(menu);
  };

  const cancelToggle = () => setConfirmingMenu(null);

  const confirmToggle = async () => {
    if (!confirmingMenu || isSaving || fetchFailed) return;
    const target = confirmingMenu;
    // 確認UIを即座に非表示にして連打による二重送信の経路を断つ
    setConfirmingMenu(null);
    setIsSaving(true);
    setMessage('');
    try {
      await axios.patch(`/admin/menus/${target.id}/toggle-status`, {}, {
        headers: { Accept: 'application/json' },
      });
      await fetchMenus().catch(() => {});
      setMessage(`「${target.name}」を${target.is_active ? '非公開' : '公開'}にしました`);
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
    menus,
    isLoading,
    isSaving,
    fetchFailed,
    isMenuModalOpen,
    editingMenu,
    confirmingMenu,
    message,
    messageType,
    fetchMenus,
    openModal,
    closeModal,
    requestToggle,
    confirmToggle,
    cancelToggle,
  };
};
