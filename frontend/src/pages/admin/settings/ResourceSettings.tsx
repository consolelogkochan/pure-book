import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../../../components/Button'; 

// APIから返ってくるスタッフとスケジュールの型定義
interface StaffSchedule {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

interface Staff {
  id: number;
  name: string;
  role: string | null;
  schedule: StaffSchedule | null; // scheduleがない場合(null)も考慮
}

// 曜日表示用の定数
const DAYS_OF_WEEK = [
  { key: 'monday', label: '月' },
  { key: 'tuesday', label: '火' },
  { key: 'wednesday', label: '水' },
  { key: 'thursday', label: '木' },
  { key: 'friday', label: '金' },
  { key: 'saturday', label: '土' },
  { key: 'sunday', label: '日' },
] as const;

export const ResourceSettings = () => {
  const [staffs, setStaffs] = useState<Staff[]>([]);

  // 1. 初回マウント時にスタッフ（とスケジュール）を取得
  const fetchResources = async () => {
    try {
      // 稼働中のスタッフとシフト情報(リレーション)を取得
      const res = await axios.get('http://localhost/api/admin/resources');
      
      // 取得したデータの中に schedule が無い（新規スタッフ等）場合、
      // 全曜日 true(出勤) のデフォルトデータを持たせて画面にセットする
      const formattedData = res.data.map((staff: any) => ({
        ...staff,
        schedule: staff.schedule || {
          monday: true, tuesday: true, wednesday: true,
          thursday: true, friday: true, saturday: true, sunday: true
        }
      }));
      setStaffs(formattedData);
    } catch (error) {
      console.error('リソースデータの取得に失敗しました', error);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // 2. プルダウンを変更した時の処理（ローカルのStateだけを書き換える）
  const handleScheduleChange = (staffId: number, dayKey: keyof StaffSchedule, value: boolean) => {
    setStaffs(prevStaffs => prevStaffs.map(staff => {
      if (staff.id === staffId && staff.schedule) {
        return {
          ...staff,             // ① スタッフの基本情報（name, role等）を全部コピー！
          schedule: {           // ② scheduleオブジェクトの中身だけ、変更された曜日の値を上書きする
            ...staff.schedule,  // ③ 今までの月〜日のシフト情報を全部コピー！
            [dayKey]: value     // ④ 変更された曜日の値だけ、value（出勤/休み）に書き換える
          }
        };
      }
      return staff;
    }));
  };

  // 3. 「変更を保存」ボタンを押した時の処理（一括保存APIを叩く）
  const handleBulkSave = async () => {
    try {
      await axios.post('http://localhost/api/admin/resources/bulk', staffs, {
        headers: { 'Accept': 'application/json' }
      });
      alert('シフトを一括保存しました！');
      fetchResources(); // 保存後に再取得して画面を最新にする
    } catch (error) {
      alert('保存に失敗しました。');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative grid grid-cols-1">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-2 gap-4 sm:gap-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">リソース（シフト）設定</h2>
          <p className="text-sm text-slate-500 mt-1">スタッフごとの稼働曜日を設定します。</p>
        </div>
        <Button onClick={handleBulkSave} colorClass="bg-blue-600 hover:bg-blue-700 py-2 px-4 text-sm w-full sm:w-auto shadow-sm">
          変更を保存
        </Button>
      </div>

      <div className="overflow-x-auto pb-2">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-200">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-3 font-bold text-sm text-slate-600 sticky left-0 bg-slate-50 z-10 w-48 shadow-[1px_0_0_#e2e8f0]">スタッフ名</th>
              {DAYS_OF_WEEK.map(day => (
                <th key={day.key} className={`p-3 font-bold text-sm text-center ${day.key === 'saturday' ? 'text-blue-600' : day.key === 'sunday' ? 'text-red-600' : 'text-slate-600'}`}>
                  {day.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staffs.map(staff => (
              <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 sticky left-0 bg-white z-10 shadow-[1px_0_0_#e2e8f0]">
                  <div className="font-bold text-slate-800">{staff.name}</div>
                  <div className="text-xs text-slate-500">{staff.role || '未設定'}</div>
                </td>
                {DAYS_OF_WEEK.map(day => (
                  <td key={day.key} className="p-3 text-center">
                    <select
                      value={staff.schedule?.[day.key] ? 'true' : 'false'}
                      onChange={(e) => handleScheduleChange(staff.id, day.key, e.target.value === 'true')}
                      className={`border rounded px-2 py-1 text-sm font-bold w-20 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                        staff.schedule?.[day.key] ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                    >
                      <option value="true">出勤</option>
                      <option value="false">休み</option>
                    </select>
                  </td>
                ))}
              </tr>
            ))}
            {staffs.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  稼働中のスタッフがいません。スタッフ管理画面でスタッフを追加してください。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};