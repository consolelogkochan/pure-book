import { Button } from '../../../components/Button'; // 既存ボタンの使い回し

export const HoursSettings = () => {
  const daysOfWeek = ['月', '火', '水', '木', '金', '土', '日'];

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-xl font-bold text-slate-800 border-b pb-2">営業時間・休業日設定</h2>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-3">定休日の設定</label>
        <div className="flex flex-wrap gap-2">
          {daysOfWeek.map(day => (
            <label key={day} className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded cursor-pointer hover:bg-slate-100 transition-colors">
              <input type="checkbox" className="w-4 h-4 text-blue-600 cursor-pointer" defaultChecked={day === '火'} />
              <span className="font-bold text-slate-700">{day}曜日</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-3">基本営業時間</label>
        <div className="flex items-center space-x-4">
          <select className="border border-slate-300 rounded px-4 py-2" defaultValue="09:00"><option>09:00</option></select>
          <span>〜</span>
          <select className="border border-slate-300 rounded px-4 py-2" defaultValue="18:00"><option>18:00</option></select>
        </div>
      </div>
      
      {/* 既存の Button コンポーネントを活用 */}
      <Button colorClass="bg-slate-800 hover:bg-slate-700 py-3 px-8 shadow-sm">
        設定を保存する
      </Button>
    </div>
  );
};