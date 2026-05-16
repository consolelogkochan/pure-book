import { usePeriodSettings } from '../../../hooks/usePeriodSettings';
import { Button } from '../../../components/Button';

export const PeriodSettings = () => {
  const { form, isLoading, isSaving, fetchFailed, message, messageType, saveSettings } = usePeriodSettings();
  const { register, watch } = form;
  const deadlineType = watch('booking_deadline_type');

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
          <h2 className="text-xl font-bold text-slate-800">予約受付ルールの設定</h2>
          <p className="text-sm text-slate-500 mt-1">直前予約を防ぐための締め切りタイミングを設定します。</p>
        </div>
        {/* Issue 4: フェッチ失敗時も保存を封じる */}
        <Button
          onClick={saveSettings}
          disabled={saveDisabled}
          colorClass={`${saveDisabled ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} py-2 px-6 text-sm shadow-sm font-bold`}
        >
          {isSaving ? '保存中...' : '設定を保存する'}
        </Button>
      </div>

      {/* Issue 3: isSaving 中はフォーム全体を無効化 */}
      <fieldset disabled={isSaving} className="border-0 p-0 m-0 space-y-6">

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">

          {/* パターンA: 時間ベース */}
          <label className={`block border-2 rounded-xl p-5 cursor-pointer transition-colors ${
            deadlineType === 'time_based'
              ? 'border-blue-500 bg-blue-50/30'
              : 'border-slate-200 hover:border-slate-300'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="shrink-0 mt-1">
                {/* Issue 2: checked を明示して react-hook-form の制御下に置く */}
                <input
                  {...register('booking_deadline_type')}
                  type="radio"
                  value="time_based"
                  checked={deadlineType === 'time_based'}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-800 text-lg">来店時間の〇時間前まで（当日予約OK）</div>
                <p className="text-sm text-slate-500 mt-1 mb-4">
                  当日の空き枠を活用したい場合におすすめの設定です。
                </p>
                <div className={`flex items-center space-x-2 transition-opacity ${
                  deadlineType === 'time_based' ? 'opacity-100' : 'opacity-40 pointer-events-none'
                }`}>
                  <span className="font-medium text-slate-700">来店時間の</span>
                  <input
                    {...register('booking_deadline_hours', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="font-medium text-slate-700">時間前まで受付</span>
                </div>
              </div>
            </div>
          </label>

          {/* パターンB: 日付ベース */}
          <label className={`block border-2 rounded-xl p-5 cursor-pointer transition-colors ${
            deadlineType === 'date_based'
              ? 'border-blue-500 bg-blue-50/30'
              : 'border-slate-200 hover:border-slate-300'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="shrink-0 mt-1">
                {/* Issue 2: checked を明示して react-hook-form の制御下に置く */}
                <input
                  {...register('booking_deadline_type')}
                  type="radio"
                  value="date_based"
                  checked={deadlineType === 'date_based'}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-800 text-lg">〇日前の〇時まで（当日予約NG）</div>
                <p className="text-sm text-slate-500 mt-1 mb-4">
                  前日までにスタッフのシフトや準備を完全に確定させたい場合におすすめです。
                </p>
                <div className={`flex flex-wrap items-center gap-2 transition-opacity ${
                  deadlineType === 'date_based' ? 'opacity-100' : 'opacity-40 pointer-events-none'
                }`}>
                  <span className="font-medium text-slate-700">来店日の</span>
                  <input
                    {...register('booking_deadline_days', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="font-medium text-slate-700">日前の</span>
                  <input
                    {...register('booking_deadline_time')}
                    type="time"
                    className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="font-medium text-slate-700">まで受付</span>
                </div>
              </div>
            </div>
          </label>

        </div>

        {/* キャンセル受付ルール */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-slate-800 text-base">キャンセル受付ルールの設定</h3>
            <p className="text-sm text-slate-500 mt-1">
              顧客がシステムからキャンセルできる期限を設定します。期限を過ぎた場合は店舗への電話が必要になります。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-700">来店時間の</span>
            <input
              {...register('cancel_deadline_hours', { valueAsNumber: true })}
              type="number"
              min="0"
              className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="font-medium text-slate-700">時間前まで受付</span>
          </div>
        </div>

      </fieldset>

    </div>
  );
};
