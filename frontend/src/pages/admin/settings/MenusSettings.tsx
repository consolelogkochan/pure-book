import { useState, useEffect } from 'react';
import { Button } from '../../../components/Button';

// APIから返ってくるメニューの型定義
interface Menu {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
}

export const MenusSettings = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

  // フォーム用のState
  const [formData, setFormData] = useState({ name: '', price: 0, duration_minutes: 60 });

  // 1. 初回マウント時にメニュー一覧を取得
  const fetchMenus = async () => {
    try {
      const res = await fetch('http://localhost/api/admin/menus');
      const data = await res.json();
      setMenus(data);
    } catch (error) {
      console.error('メニューの取得に失敗しました', error);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // 2. 伊崎さんの推論！ 削除の代わりにステータス切り替え
  const handleToggleStatus = async (menu: Menu) => {
    const actionText = menu.is_active ? '非公開' : '公開';
    if (!window.confirm(`本当に「${menu.name}」を${actionText}にしますか？`)) return;

    try {
      await fetch(`http://localhost/api/admin/menus/${menu.id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Accept': 'application/json' },
      });
      fetchMenus(); // 成功したら一覧を再取得して画面を更新
    } catch (error) {
      alert('ステータスの変更に失敗しました');
    }
  };

  // 3. モーダルを開く処理（新規 or 編集）
  const openModal = (menu?: Menu) => {
    if (menu) {
      setEditingMenu(menu);
      setFormData({ name: menu.name, price: menu.price, duration_minutes: menu.duration_minutes });
    } else {
      setEditingMenu(null);
      setFormData({ name: '', price: 0, duration_minutes: 60 });
    }
    setIsMenuModalOpen(true);
  };

  // 4. 保存処理（新規作成 or 更新）
  const handleSave = async () => {
    const url = editingMenu 
      ? `http://localhost/api/admin/menus/${editingMenu.id}` 
      : 'http://localhost/api/admin/menus';
    const method = editingMenu ? 'PUT' : 'POST';

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(formData),
      });
      setIsMenuModalOpen(false);
      fetchMenus(); // 一覧を再取得
    } catch (error) {
      alert('保存に失敗しました');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-2 gap-4 sm:gap-0">
        <h2 className="text-xl font-bold text-slate-800">メニュー登録</h2>
        <Button onClick={() => openModal()} colorClass="bg-blue-600 hover:bg-blue-700 py-2 px-4 text-sm w-full sm:w-auto">
          ＋ 新規メニュー追加
        </Button>
      </div>
      
      <div className="overflow-x-auto pb-2">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-150">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-3 font-bold text-sm text-slate-600">状態</th>
              <th className="p-3 font-bold text-sm text-slate-600">メニュー名</th>
              <th className="p-3 font-bold text-sm text-slate-600">料金</th>
              <th className="p-3 font-bold text-sm text-slate-600">所要時間</th>
              <th className="p-3 font-bold text-sm text-slate-600 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {menus.map(menu => (
              <tr key={menu.id} className={`hover:bg-slate-50 ${!menu.is_active ? 'opacity-50 bg-slate-50' : ''}`}>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${menu.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {menu.is_active ? '公開中' : '非公開'}
                  </span>
                </td>
                <td className="p-3 font-bold text-slate-800">{menu.name}</td>
                <td className="p-3 text-slate-600">¥{menu.price.toLocaleString()}</td>
                <td className="p-3 text-slate-600">{menu.duration_minutes}分</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => openModal(menu)} className="text-sm border border-slate-300 px-3 py-1 rounded hover:bg-slate-100 font-bold">編集</button>
                  <button 
                    onClick={() => handleToggleStatus(menu)} 
                    className={`text-sm border px-3 py-1 rounded font-bold ${menu.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                  >
                    {menu.is_active ? '非公開にする' : '公開する'}
                  </button>
                </td>
              </tr>
            ))}
            {menus.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-slate-500">メニューが登録されていません</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isMenuModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">{editingMenu ? 'メニューの編集' : 'メニューの追加'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">メニュー名</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">料金 (円)</label>
                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">所要時間 (分)</label>
                <input type="number" step="10" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: Number(e.target.value)})} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsMenuModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded">キャンセル</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">保存する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};