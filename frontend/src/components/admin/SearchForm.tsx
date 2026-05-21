import type { UseFormReturn } from 'react-hook-form';
import { Button } from '../Button';
import type { Menu } from '../../types';
import type { SearchFormInputs } from '../../hooks/useAdminSearch';

interface Props {
  form: UseFormReturn<SearchFormInputs>;
  menus: Menu[];
  isLoading: boolean;
  isDownloading: boolean;
  onSubmit: (data: SearchFormInputs) => void;
  onDownloadCsv: () => void;
}

export const SearchForm = ({ form, menus, isLoading, isDownloading, onSubmit, onDownloadCsv }: Props) => {
  const { register, handleSubmit } = form;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">予約検索</h2>
        <Button
          onClick={onDownloadCsv}
          disabled={isDownloading}
          colorClass="bg-green-600 hover:bg-green-700 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {isDownloading ? 'ダウンロード中...' : 'CSV出力'}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">利用日</label>
          <input type="date" {...register('date')} className="w-full border border-slate-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">お名前</label>
          <input type="text" {...register('name')} placeholder="例: 山田" className="w-full border border-slate-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">予約番号</label>
          <input type="text" {...register('reference')} placeholder="例: BKG-..." className="w-full border border-slate-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">メニュー</label>
          <select {...register('menu')} className="w-full border border-slate-300 rounded px-3 py-2 bg-white">
            <option value="">すべて</option>
            {menus.map(menu => (
              <option key={menu.id} value={menu.id}>{menu.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">ステータス</label>
          <select {...register('status')} className="w-full border border-slate-300 rounded px-3 py-2 bg-white">
            <option value="">すべて</option>
            <option value="confirmed">予約確定</option>
            <option value="cancelled">キャンセル</option>
          </select>
        </div>
        <Button type="submit" disabled={isLoading} colorClass="bg-slate-800 hover:bg-slate-700 w-full">
          {isLoading ? '検索中...' : '検索する'}
        </Button>
      </form>
    </div>
  );
};
