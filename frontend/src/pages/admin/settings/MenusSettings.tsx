import { useState } from 'react';
import { Button } from '../../../components/Button';

export const MenusSettings = () => {
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const mockMenus = [
    { id: 1, name: 'カット', price: '¥5,000', duration: 60 },
    { id: 2, name: 'カット＆カラー', price: '¥12,000', duration: 120 },
    { id: 3, name: 'パーマ', price: '¥15,000', duration: 120 },
  ];

  const handleDelete = (_type: string, name: string) => {
    if (window.confirm(`本当に「${name}」を削除しますか？\n※関連付けられている予約がある場合は削除できません。`)) {
      alert('削除処理を実行しました（モック）');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-xl font-bold text-slate-800">メニュー登録</h2>
        <Button onClick={() => setIsMenuModalOpen(true)} colorClass="bg-blue-600 hover:bg-blue-700 py-2 px-4 text-sm">
          ＋ 新規メニュー追加
        </Button>
      </div>
      
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="p-3 font-bold text-sm text-slate-600">メニュー名</th>
            <th className="p-3 font-bold text-sm text-slate-600">料金</th>
            <th className="p-3 font-bold text-sm text-slate-600">所要時間</th>
            <th className="p-3 font-bold text-sm text-slate-600 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {mockMenus.map(menu => (
            <tr key={menu.id} className="hover:bg-slate-50">
              <td className="p-3 font-bold text-slate-800">{menu.name}</td>
              <td className="p-3 text-slate-600">{menu.price}</td>
              <td className="p-3 text-slate-600">{menu.duration}分</td>
              <td className="p-3 text-right space-x-2">
                <button onClick={() => setIsMenuModalOpen(true)} className="text-sm border border-slate-300 px-3 py-1 rounded hover:bg-slate-100 font-bold">編集</button>
                <button onClick={() => handleDelete('menu', menu.name)} className="text-sm border border-red-200 text-red-600 px-3 py-1 rounded hover:bg-red-50 font-bold">削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isMenuModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">メニューの追加・編集</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-bold mb-1">メニュー名</label><input type="text" className="w-full border rounded px-3 py-2" /></div>
              <div><label className="block text-sm font-bold mb-1">料金 (円)</label><input type="number" className="w-full border rounded px-3 py-2" /></div>
              <div><label className="block text-sm font-bold mb-1">所要時間 (分)</label><input type="number" step="10" className="w-full border rounded px-3 py-2" /></div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsMenuModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded">キャンセル</button>
              <button onClick={() => setIsMenuModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">保存する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};