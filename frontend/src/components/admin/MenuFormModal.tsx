import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from '../../axios';
import type { Menu } from '../../types';

interface MenuFormData {
  name: string;
  price: number;
  duration_minutes: number;
}

interface Props {
  isOpen: boolean;
  editingMenu: Menu | null;
  onSuccess: () => Promise<void>; // Issue 5: 非同期性を型で明示
  onClose: () => void;
}

export const MenuFormModal = ({ isOpen, editingMenu, onSuccess, onClose }: Props) => {
  // Issue 1: formState.isSubmitting を使い、手動の isSubmitting ステートを廃止
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<MenuFormData>({
    defaultValues: { name: '', price: 0, duration_minutes: 60 },
  });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    reset(
      editingMenu
        ? { name: editingMenu.name, price: editingMenu.price, duration_minutes: editingMenu.duration_minutes }
        : { name: '', price: 0, duration_minutes: 60 }
    );
    setErrorMessage('');
  }, [isOpen, editingMenu, reset]);

  // Issue 2: フォーム変更時に errorMessage を自動クリア
  useEffect(() => {
    const subscription = watch(() => setErrorMessage(''));
    return () => subscription.unsubscribe();
  }, [watch]);

  if (!isOpen) return null;

  const onSubmit = async (data: MenuFormData) => {
    setErrorMessage('');
    try {
      if (editingMenu) {
        await axios.put(`/admin/menus/${editingMenu.id}`, data, {
          headers: { Accept: 'application/json' },
        });
      } else {
        await axios.post('/admin/menus', data, {
          headers: { Accept: 'application/json' },
        });
      }
      await onSuccess(); // Issue 5: 再取得完了を待ってからモーダルを閉じる
      onClose();
    } catch (error) {
      setErrorMessage('保存に失敗しました。通信環境をご確認ください。');
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          {editingMenu ? 'メニューの編集' : 'メニューの追加'}
        </h3>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-red-100 text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* isSubmitting 中は入力フィールドを無効化。キャンセルボタンは fieldset 外で常に押せる状態を保つ */}
          <fieldset disabled={isSubmitting} className="border-0 p-0 m-0 space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">メニュー名</label>
              <input
                {...register('name', { required: 'メニュー名を入力してください' })}
                type="text"
                className="w-full border rounded px-3 py-2"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">料金 (円)</label>
              <input
                {...register('price', {
                  required: '料金を入力してください',
                  min: { value: 0, message: '0円以上で入力してください' },
                  valueAsNumber: true,
                })}
                type="number"
                className="w-full border rounded px-3 py-2"
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">所要時間 (分)</label>
              <input
                {...register('duration_minutes', {
                  required: '所要時間を入力してください',
                  min: { value: 10, message: '10分以上で入力してください' },
                  valueAsNumber: true,
                })}
                type="number"
                step="10"
                className="w-full border rounded px-3 py-2"
              />
              {errors.duration_minutes && <p className="text-red-500 text-xs mt-1">{errors.duration_minutes.message}</p>}
            </div>
          </fieldset>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 font-bold rounded text-white transition ${
                isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
