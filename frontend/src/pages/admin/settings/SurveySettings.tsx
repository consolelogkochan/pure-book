import { Button } from '../../../components/Button';

export const SurveySettings = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-slate-800 border-b pb-2">予約時アンケート設定</h2>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">お客様への質問事項</label>
        <input type="text" defaultValue="来店時のご要望や、髪の悩みなどがあればご記入ください。" className="w-full border border-slate-300 rounded px-4 py-2 text-slate-700" />
        <p className="text-xs text-slate-500 mt-2">※お客様が予約する際の最終確認画面に表示される入力フォームのラベルになります。</p>
      </div>
      <div className="flex items-center space-x-2 mt-4 bg-slate-50 p-4 rounded border border-slate-200">
        <input type="checkbox" id="required" className="w-5 h-5 cursor-pointer" />
        <label htmlFor="required" className="font-bold text-slate-700 cursor-pointer">このアンケートを「必須回答」にする</label>
      </div>
      <Button colorClass="bg-slate-800 hover:bg-slate-700 py-3 px-8 shadow-sm">
        設定を保存する
      </Button>
    </div>
  );
};