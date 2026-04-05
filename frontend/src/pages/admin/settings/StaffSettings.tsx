import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../../../components/Button'; 

interface Staff {
  id: number;
  name: string;
  role: string | null;
  is_active: boolean;
}

export const StaffSettings = () => {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [formData, setFormData] = useState({ name: '', role: '' });
  
  // 一覧取得
  const fetchStaffs = async () => {
    try {
      const res = await axios.get('http://localhost/api/admin/staffs');
      setStaffs(res.data);
    } catch (error) {
      console.error('スタッフの取得に失敗しました', error);
    }
  };

  useEffect(() => {
    fetchStaffs();
  }, []);

  // ステータス切り替え
  const handleToggleStatus = async (staff: Staff) => {
    const actionText = staff.is_active ? '稼働停止' : '稼働再開';
    if (!window.confirm(`本当に「${staff.name}」を${actionText}にしますか？`)) return;

    try {
      await axios.patch(`http://localhost/api/admin/staffs/${staff.id}/toggle-status`, {}, {
        headers: { 'Accept': 'application/json' }
      });
      fetchStaffs();
    } catch (error) {
      alert('ステータスの変更に失敗しました');
    }
  };

  const openModal = (staff?: Staff) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({ name: staff.name, role: staff.role || '' }); // nullの場合は空文字にする
    } else {
      setEditingStaff(null);
      setFormData({ name: '', role: '' });
    }
    setIsStaffModalOpen(true);
  };

  // 保存処理
  const handleSave = async () => {
    const url = editingStaff 
      ? `http://localhost/api/admin/staffs/${editingStaff.id}` 
      : 'http://localhost/api/admin/staffs';
    const method = editingStaff ? 'put' : 'post';

    try {
      await axios({
        method,
        url,
        data: formData,
        headers: { 'Accept': 'application/json' },
      });
      setIsStaffModalOpen(false);
      fetchStaffs();
    } catch (error) {
      alert('保存に失敗しました');
    }
  };


  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-2 gap-4 sm:gap-0">
        <h2 className="text-xl font-bold text-slate-800">スタッフ登録</h2>
        <Button onClick={() => openModal()} colorClass="bg-blue-600 hover:bg-blue-700 py-2 px-4 text-sm w-full sm:w-auto">
          ＋ 新規スタッフ追加
        </Button>
      </div>
      
      <div className="overflow-x-auto pb-2">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-150">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-3 font-bold text-sm text-slate-600">状態</th>
              <th className="p-3 font-bold text-sm text-slate-600">スタッフ名</th>
              <th className="p-3 font-bold text-sm text-slate-600">役職・ラベル</th>
              <th className="p-3 font-bold text-sm text-slate-600 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staffs.map(staff => (
              <tr key={staff.id} className={`hover:bg-slate-50 ${!staff.is_active ? 'opacity-50 bg-slate-50' : ''}`}>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${staff.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {staff.is_active ? '稼働中' : '停止中'}
                  </span>
                </td>
                <td className="p-3 font-bold text-slate-800">{staff.name}</td>
                <td className="p-3 text-slate-600">
                  {staff.role ? (
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs">{staff.role}</span>
                  ) : (
                    <span className="text-slate-400 text-xs">未設定</span>
                  )}
                </td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => openModal(staff)} className="text-sm border border-slate-300 px-3 py-1 rounded hover:bg-slate-100 font-bold">編集</button>
                  <button 
                    onClick={() => handleToggleStatus(staff)} 
                    className={`text-sm border px-3 py-1 rounded font-bold ${staff.is_active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                  >
                    {staff.is_active ? '稼働停止にする' : '稼働再開する'}
                  </button>
                </td>
              </tr>
            ))}
            {staffs.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-slate-500">スタッフが登録されていません</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">{editingStaff ? 'スタッフの編集' : 'スタッフの追加'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">スタッフ名</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">役職・ラベル</label>
                <input type="text" placeholder="例: 店長、スタイリスト" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsStaffModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded">キャンセル</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">保存する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};