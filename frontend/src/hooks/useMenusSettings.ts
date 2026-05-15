import { useState, useEffect } from 'react';
import axios from '../axios';
import type { Menu } from '../types';

interface UseMenusSettingsReturn {
  menus: Menu[];
  isLoading: boolean;
  isSaving: boolean;
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
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [confirmingMenu, setConfirmingMenu] = useState<Menu | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  // Issue 4: fetchMenus は純粋な再取得のみ担う。isLoading の管理は初回 useEffect に委譲。
  const fetchMenus = async () => {
    try {
      const res = await axios.get('/admin/menus');
      setMenus(res.data);
    } catch (error) {
      console.error('メニューの取得に失敗しました', error);
      setMessage('メニューの取得に失敗しました。ページを再読み込みしてください。');
      setMessageType('error');
    }
  };

  useEffect(() => {
    fetchMenus().finally(() => setIsLoading(false));
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
    setMessage('');
    setConfirmingMenu(menu);
  };

  const cancelToggle = () => setConfirmingMenu(null);

  const confirmToggle = async () => {
    if (!confirmingMenu || isSaving) return;
    const target = confirmingMenu;
    setIsSaving(true);

    try {
      await axios.patch(`/admin/menus/${target.id}/toggle-status`, {}, {
        headers: { Accept: 'application/json' },
      });
      await fetchMenus();
      setMessage(`「${target.name}」を${target.is_active ? '非公開' : '公開'}にしました`);
      setMessageType('success');
    } catch (error) {
      setMessage('ステータスの変更に失敗しました。通信環境をご確認ください。');
      setMessageType('error');
      console.error(error);
    } finally {
      // Issue 3: 成功・失敗どちらでも確認ダイアログを閉じ、エラーバナーを見えるようにする
      setConfirmingMenu(null);
      setIsSaving(false);
    }
  };

  return {
    menus,
    isLoading,
    isSaving,
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
