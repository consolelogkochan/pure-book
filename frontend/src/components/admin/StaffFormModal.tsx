import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from '../../axios';
import type { Staff } from '../../types';

interface StaffFormData {
  name: string;
  role: string;
}

interface Props {
  isOpen: boolean;
  editingStaff: Staff | null;
  onSuccess: () => Promise<void>;
  onClose: () => void;
}

export const StaffFormModal = ({ isOpen, editingStaff, onSuccess, onClose }: Props) => {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<StaffFormData>({
    defaultValues: { name: '', role: '' },
  });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    reset(
      editingStaff
        ? { name: editingStaff.name, role: editingStaff.role || '' }
        : { name: '', role: '' }
    );
    setErrorMessage('');
  }, [isOpen, editingStaff, reset]);

  useEffect(() => {
    const subscription = watch(() => setErrorMessage(''));
    return () => subscription.unsubscribe();
  }, [watch]);

  if (!isOpen) return null;

  const onSubmit = async (data: StaffFormData) => {
    setErrorMessage('');
    try {
      if (editingStaff) {
        await axios.put(`/admin/staffs/${editingStaff.id}`, data, {
          headers: { Accept: 'application/json' },
        });
      } else {
        await axios.post('/admin/staffs', data, {
          headers: { Accept: 'application/json' },
        });
      }
      await onSuccess().catch(() => {}); // Issue 1: 再取得失敗を保存失敗と区別する
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
          {editingStaff ? 'スタッフの編集' : 'スタッフの追加'}
        </h3>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg text-sm font-medium bg-red-100 text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* isSubmitting 中は入力フィールドを一括ロック。キャンセルは fieldset 外で常に押せる状態を保つ */}
          <fieldset disabled={isSubmitting} className="border-0 p-0 m-0 space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">スタッフ名</label>
              <input
                {...register('name', { required: 'スタッフ名を入力してください' })}
                type="text"
                className="w-full border rounded px-3 py-2"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">役職・ラベル</label>
              <input
                {...register('role')}
                type="text"
                placeholder="例: 店長、スタイリスト"
                className="w-full border rounded px-3 py-2"
              />
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
