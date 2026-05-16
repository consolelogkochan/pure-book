import { useHoursSettings } from '../../../hooks/useHoursSettings';
import { Button } from '../../../components/Button';

const DAYS_OF_WEEK = [
  { key: 'monday', label: '月曜日' },
  { key: 'tuesday', label: '火曜日' },
  { key: 'wednesday', label: '水曜日' },
  { key: 'thursday', label: '木曜日' },
  { key: 'friday', label: '金曜日' },
  { key: 'saturday', label: '土曜日' },
  { key: 'sunday', label: '日曜日' },
] as const;

export const HoursSettings = () => {
  const { form, isLoading, isSaving, fetchFailed, message, messageType, toggleHoliday, isHoliday, saveSettings } = useHoursSettings();
  const { register } = form;

  if (isLoading) return <div className="p-4 text-slate-500">読み込み中...</div>;

  const saveDisabled = isSaving || fetchFailed;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-2 gap-4 sm:gap-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">店舗基本設定</h2>
          <p className="text-sm text-slate-500 mt-1">営業時間や定休日、利用規約を設定します。</p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={saveDisabled}
          colorClass={`${saveDisabled ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} py-2 px-6 text-sm shadow-sm font-bold`}
        >
          {isSaving ? '保存中...' : '設定を保存する'}
        </Button>
      </div>

      {/* Issue 3: isSaving 中はフォーム全体を無効化 */}
      <fieldset disabled={isSaving} className="border-0 p-0 m-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-2">1</span>
              営業時間
            </h3>
            <div className="flex items-center space-x-4">
              <input
                {...register('open_time')}
                type="time"
                className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="font-bold text-slate-400">〜</span>
              <input
                {...register('close_time')}
                type="time"
                className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </section>

          <hr className="border-slate-100" />

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-2">2</span>
              定休日の設定
            </h3>
            <div className="flex flex-wrap gap-4">
              {DAYS_OF_WEEK.map(day => {
                const isChecked = isHoliday(day.key);
                return (
                  <label key={day.key} className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleHoliday(day.key)}
                      className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className={`font-medium ${isChecked ? 'text-slate-800' : 'text-slate-500 group-hover:text-slate-700'}`}>
                      {day.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <hr className="border-slate-100" />

          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-2">3</span>
              利用規約テキスト
            </h3>
            <p className="text-sm text-slate-500 mb-3">
              お客様が予約を確定する前に同意を求める規約文を入力してください。
            </p>
            <textarea
              {...register('terms_text')}
              rows={8}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed text-slate-700"
              placeholder="利用規約を入力..."
            />
          </section>

        </div>
      </fieldset>

    </div>
  );
};
