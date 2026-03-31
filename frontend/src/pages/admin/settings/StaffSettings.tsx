import { useState } from 'react';
import { Button } from '../../../components/Button';

export const StaffSettings = () => {
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const mockStaffs = [
    { id: 1, name: '鈴木 一郎', role: '店長' },
    { id: 2, name: '田中 美咲', role: 'スタイリスト' },
    { id: 3, name: '佐藤 花子', role: 'アシスタント' },
  ];

  const handleDelete = (_type: string, name: string) => {
    if (window.confirm(`本当に「${name}」を削除しますか？\n※関連付けられている予約がある場合は削除できません。`)) {
      alert('削除処理を実行しました（モック）');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-xl font-bold text-slate-800">スタッフ登録</h2>
        <Button onClick={() => setIsStaffModalOpen(true)} colorClass="bg-blue-600 hover:bg-blue-700 py-2 px-4 text-sm">
          ＋ 新規スタッフ追加
        </Button>
      </div>
      
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="p-3 font-bold text-sm text-slate-600">スタッフ名</th>
            <th className="p-3 font-bold text-sm text-slate-600">役職・ラベル</th>
            <th className="p-3 font-bold text-sm text-slate-600 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {mockStaffs.map(staff => (
            <tr key={staff.id} className="hover:bg-slate-50">
              <td className="p-3 font-bold text-slate-800">{staff.name}</td>
              <td className="p-3 text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{staff.role}</span></td>
              <td className="p-3 text-right space-x-2">
                <button onClick={() => setIsStaffModalOpen(true)} className="text-sm border border-slate-300 px-3 py-1 rounded hover:bg-slate-100 font-bold">編集</button>
                <button onClick={() => handleDelete('staff', staff.name)} className="text-sm border border-red-200 text-red-600 px-3 py-1 rounded hover:bg-red-50 font-bold">削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">スタッフの追加・編集</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-bold mb-1">スタッフ名</label><input type="text" className="w-full border rounded px-3 py-2" /></div>
              <div><label className="block text-sm font-bold mb-1">役職・ラベル</label><input type="text" placeholder="例: 店長、スタイリスト" className="w-full border rounded px-3 py-2" /></div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsStaffModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded">キャンセル</button>
              <button onClick={() => setIsStaffModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">保存する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};