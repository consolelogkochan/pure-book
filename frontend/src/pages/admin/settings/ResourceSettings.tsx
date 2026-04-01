import { Button } from '../../../components/Button'; 

export const ResourceSettings = () => {
  const mockStaffs = [
    { id: 1, name: '鈴木 一郎', role: '店長' },
    { id: 2, name: '田中 美咲', role: 'スタイリスト' },
    { id: 3, name: '佐藤 花子', role: 'アシスタント' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 変更点1: スマホ時はタイトルと説明文を縦並び(flex-col)にし、説明文の文字サイズを少し小さくする */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b pb-2 gap-2 sm:gap-0">
        <h2 className="text-xl font-bold text-slate-800">リソース管理（シフト設定）</h2>
        <span className="text-xs sm:text-sm text-slate-500">※カレンダーに表示する出勤状況を設定します</span>
      </div>
      
      {/* 変更点2: overflow-x-auto で囲み、8列分の広さを確保するため min-w-200 と whitespace-nowrap を追加 */}
      <div className="overflow-x-auto pb-2">
        <table className="w-full text-center border-collapse whitespace-nowrap min-w-200">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-3 font-bold text-sm text-slate-600 text-left">スタッフ名</th>
              {['月', '火', '水', '木', '金', '土', '日'].map(day => (
                <th key={day} className="p-3 font-bold text-sm text-slate-600">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockStaffs.map(staff => (
              <tr key={staff.id} className="hover:bg-slate-50">
                <td className="p-3 font-bold text-slate-800 text-left">{staff.name}</td>
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <td key={day} className="p-3">
                    <select className={`border rounded px-2 py-1 text-sm font-bold ${day === 3 && staff.id === 2 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-700'}`}>
                      <option value="work">出勤</option>
                      <option value="off" selected={day === 3 && staff.id === 2}>休み</option>
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 変更点3: スマホ時は「シフトを保存」ボタンを w-full にして押しやすくする */}
      <div className="flex justify-center sm:justify-end mt-4">
        <Button colorClass="bg-slate-800 hover:bg-slate-700 py-3 sm:py-2 px-8 shadow-sm w-full sm:w-auto">
          シフトを保存
        </Button>
      </div>

    </div>
  );
};