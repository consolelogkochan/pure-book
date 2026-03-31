import { Button } from '../../../components/Button';

export const PeriodSettings = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-slate-800 border-b pb-2">予約受付期間の設定</h2>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">何日先まで予約を受け付けますか？</label>
        <div className="flex items-center space-x-2">
          <input type="number" defaultValue={30} className="border border-slate-300 rounded px-4 py-2 w-24 text-right font-bold text-slate-700" />
          <span className="font-bold text-slate-700">日後まで</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">例：30日後に設定すると、今日から約1ヶ月先までのカレンダーがお客様に公開されます。</p>
      </div>
      <Button colorClass="bg-slate-800 hover:bg-slate-700 py-3 px-8 shadow-sm">
        設定を保存する
      </Button>
    </div>
  );
};