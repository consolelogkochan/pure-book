import { useAdminEventForm, type SelectedBooking } from '../../hooks/useAdminEventForm';
import type { Menu } from '../../types';

interface Props {
  selectedBooking: SelectedBooking;
  menus: Menu[];
  onSuccess: () => void;
}

export const EventCreateForm = ({ selectedBooking, menus, onSuccess }: Props) => {
  const { form, onSubmit, message, messageType } = useAdminEventForm({ selectedBooking, onSuccess });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  return (
    <form key="new" onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
      <fieldset disabled={isSubmitting} className="border-0 p-0 m-0 flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* お客様情報（入力可能） */}
          <div className="bg-white border rounded-lg p-4 space-y-3">
            <h4 className="font-bold text-slate-700 border-b pb-2">お客様情報</h4>
            <div>
              <label className="block text-xs text-slate-500 mb-1">お名前</label>
              <input {...register('customer_name', { required: '必須項目です' })} type="text" className="w-full border rounded px-3 py-2 font-bold" />
              {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name.message}</p>}
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">電話番号</label>
                <input {...register('customer_phone', { required: '必須項目です' })} type="text" className="w-full border rounded px-3 py-2 text-sm" />
                {errors.customer_phone && <p className="text-red-500 text-xs mt-1">{errors.customer_phone.message}</p>}
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">メール</label>
                <input {...register('customer_email', { required: '必須項目です' })} type="email" className="w-full border rounded px-3 py-2 text-sm" />
                {errors.customer_email && <p className="text-red-500 text-xs mt-1">{errors.customer_email.message}</p>}
              </div>
            </div>
          </div>

          {/* 予約内容 */}
          <div className="bg-white border border-blue-200 rounded-lg p-4 space-y-3">
            <h4 className="font-bold text-blue-700 border-b border-blue-100 pb-2">予約内容の編集</h4>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">メニュー</label>
              <select {...register('menu_id', { required: true, valueAsNumber: true })} className="w-full border border-slate-300 rounded px-3 py-2 bg-white outline-none focus:border-blue-500">
                {menus.map(menu => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name} ({menu.duration_minutes}分)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-600 mb-1">日付</label>
                <input {...register('start_date_only', { required: true })} type="date" className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-600 mb-1">開始時間</label>
                <input {...register('start_time_only', { required: true })} type="time" className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">ステータス変更</label>
              <select {...register('status')} className="w-full border border-slate-300 rounded px-3 py-2 bg-white outline-none focus:border-blue-500">
                <option value="confirmed">予約確定（通常）</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">店舗用メモ</label>
            <textarea {...register('customer_memo')} className="w-full border rounded px-3 py-2 h-20 resize-none outline-none focus:border-blue-500" placeholder="お客様のご要望や、店舗側の引き継ぎ事項" />
          </div>

        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition shadow-sm disabled:bg-gray-400">
            {isSubmitting ? '登録中...' : '変更を保存する'}
          </button>
        </div>
      </fieldset>
    </form>
  );
};
