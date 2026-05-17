import { useResourceSettings } from '../../../hooks/useResourceSettings';
import { Button } from '../../../components/Button';

const DAYS_OF_WEEK = [
  { key: 'monday', label: '月' },
  { key: 'tuesday', label: '火' },
  { key: 'wednesday', label: '水' },
  { key: 'thursday', label: '木' },
  { key: 'friday', label: '金' },
  { key: 'saturday', label: '土' },
  { key: 'sunday', label: '日' },
] as const;

export const ResourceSettings = () => {
  const { staffs, isLoading, isSaving, fetchFailed, message, messageType, handleScheduleChange, handleBulkSave } = useResourceSettings();

  if (isLoading) return <div className="p-4 text-slate-500">読み込み中...</div>;

  const saveDisabled = isSaving || fetchFailed;

  return (
    <div className="space-y-6 animate-fade-in relative grid grid-cols-1">

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-2 gap-4 sm:gap-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">リソース（シフト）設定</h2>
          <p className="text-sm text-slate-500 mt-1">スタッフごとの稼働曜日を設定します。</p>
        </div>
        <Button
          onClick={handleBulkSave}
          disabled={saveDisabled}
          colorClass={`${saveDisabled ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} py-2 px-4 text-sm w-full sm:w-auto shadow-sm`}
        >
          {isSaving ? '保存中...' : '変更を保存'}
        </Button>
      </div>

      <div className="overflow-x-auto pb-2">
        {/* isSaving 中はテーブル内の全セレクトボックスを一括ロック */}
        <fieldset disabled={isSaving} className="border-0 p-0 m-0">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-200">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 font-bold text-sm text-slate-600 sticky left-0 bg-slate-50 z-10 w-48 shadow-[1px_0_0_#e2e8f0]">スタッフ名</th>
                {DAYS_OF_WEEK.map(day => (
                  <th key={day.key} className={`p-3 font-bold text-sm text-center ${
                    day.key === 'saturday' ? 'text-blue-600' : day.key === 'sunday' ? 'text-red-600' : 'text-slate-600'
                  }`}>
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffs.map(staff => (
                <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 sticky left-0 bg-white z-10 shadow-[1px_0_0_#e2e8f0]">
                    <div className="font-bold text-slate-800">{staff.name}</div>
                    <div className="text-xs text-slate-500">{staff.role || '未設定'}</div>
                  </td>
                  {DAYS_OF_WEEK.map(day => (
                    <td key={day.key} className="p-3 text-center">
                      <select
                        value={staff.schedule?.[day.key] ? 'true' : 'false'}
                        onChange={e => handleScheduleChange(staff.id, day.key, e.target.value === 'true')}
                        className={`border rounded px-2 py-1 text-sm font-bold w-20 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                          staff.schedule?.[day.key]
                            ? 'bg-white border-slate-300 text-slate-700'
                            : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                      >
                        <option value="true">出勤</option>
                        <option value="false">休み</option>
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
              {staffs.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    稼働中のスタッフがいません。スタッフ管理画面でスタッフを追加してください。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </fieldset>
      </div>

    </div>
  );
};
