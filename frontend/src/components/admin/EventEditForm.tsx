import { useAdminEventForm, type SelectedBooking } from '../../hooks/useAdminEventForm';
import type { Menu } from '../../types';

interface Props {
  selectedBooking: SelectedBooking;
  menus: Menu[];
  onSuccess: () => void;
}

export const EventEditForm = ({ selectedBooking, menus, onSuccess }: Props) => {
  const { form, onSubmit } = useAdminEventForm({ selectedBooking, onSuccess });
  const { register, handleSubmit, formState: { isSubmitting } } = form;

  return (
    <form key={selectedBooking.id} onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* 予約番号・ステータスバッジ */}
        <div className="bg-slate-100 p-3 rounded text-sm text-slate-600 font-mono flex justify-between items-center">
          <span>予約番号: {selectedBooking.booking_reference}</span>
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              selectedBooking.payment_status === 'paid' ? 'bg-indigo-100 text-indigo-700' :
              selectedBooking.payment_status === 'refunded' ? 'bg-red-100 text-red-700' :
              'bg-slate-200 text-slate-600'
            }`}>
              {selectedBooking.payment_status === 'paid' ? '事前決済済' :
               selectedBooking.payment_status === 'refunded' ? '返金済' : '未決済'}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              selectedBooking.status === 'cancelled' ? 'bg-slate-200 text-slate-600' : 'bg-green-100 text-green-700'
            }`}>
              {selectedBooking.status === 'cancelled' ? 'キャンセル済' : '予約確定'}
            </span>
          </div>
        </div>

        {/* お客様情報（読み取り専用） */}
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <h4 className="font-bold text-slate-700 border-b pb-2">お客様情報</h4>
          <div>
            <label className="block text-xs text-slate-500 mb-1">お名前</label>
            <input {...register('customer_name')} type="text" className="w-full border rounded px-3 py-2 font-bold" readOnly />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">電話番号</label>
              <input {...register('customer_phone')} type="text" className="w-full border rounded px-3 py-2 text-sm" readOnly />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">メール</label>
              <input {...register('customer_email')} type="email" className="w-full border rounded px-3 py-2 text-sm" readOnly />
            </div>
          </div>
        </div>

        {/* 予約内容（編集可能） */}
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

        {/* アンケート結果 */}
        {selectedBooking.survey_responses && Object.keys(selectedBooking.survey_responses).length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
            <h4 className="font-bold text-blue-800 border-b border-blue-200 pb-2">事前アンケート回答</h4>
            {Object.entries(selectedBooking.survey_responses).map(([question, answer], index) => (
              <div key={index}>
                <p className="text-xs text-blue-600 mb-1">{question}</p>
                <p className="text-sm font-bold text-slate-800 bg-white px-2 py-1 rounded">{String(answer)}</p>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">店舗用メモ</label>
          <textarea {...register('customer_memo')} className="w-full border rounded px-3 py-2 h-20 resize-none outline-none focus:border-blue-500" placeholder="お客様のご要望や、店舗側の引き継ぎ事項" />
        </div>

      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition shadow-sm disabled:bg-gray-400">
          {isSubmitting ? '更新中...' : '変更を保存する'}
        </button>
      </div>
    </form>
  );
};
