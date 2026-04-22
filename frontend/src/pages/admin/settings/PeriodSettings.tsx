import { useState, useEffect } from 'react';
// 設定済みの専用Axiosを呼ぶ
import axios from '../../../axios';
import { Button } from '../../../components/Button';

// APIとやり取りする全データの型定義（営業時間なども含める）
interface HoursSetting {
  open_time: string;
  close_time: string;
  regular_holidays: string[];
  terms_text: string;
  booking_deadline_type: 'time_based' | 'date_based';
  booking_deadline_hours: number;
  booking_deadline_days: number;
  booking_deadline_time: string;
}

export const PeriodSettings = () => {
  const [formData, setFormData] = useState<HoursSetting>({
    open_time: '10:00',
    close_time: '20:00',
    regular_holidays: [],
    terms_text: '',
    booking_deadline_type: 'time_based',
    booking_deadline_hours: 2,
    booking_deadline_days: 1,
    booking_deadline_time: '17:00',
  });

  const [isLoading, setIsLoading] = useState(true);

  // 1. 初回マウント時に設定を"すべて"取得
  const fetchSettings = async () => {
    try {
      const res = await axios.get('http://localhost/api/admin/settings');
      setFormData({
        open_time: res.data.open_time.substring(0, 5),
        close_time: res.data.close_time.substring(0, 5),
        regular_holidays: res.data.regular_holidays || [],
        terms_text: res.data.terms_text || '',
        booking_deadline_type: res.data.booking_deadline_type || 'time_based',
        booking_deadline_hours: res.data.booking_deadline_hours ?? 2,
        booking_deadline_days: res.data.booking_deadline_days ?? 1,
        // DBから来る時刻は秒が含まれるためカット（nullの場合はデフォルト値）
        booking_deadline_time: res.data.booking_deadline_time ? res.data.booking_deadline_time.substring(0, 5) : '17:00',
      });
    } catch (error) {
      console.error('設定の取得に失敗しました', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // 2. 保存処理（見えないデータも含めて"すべて"送り返す）
  const handleSave = async () => {
    try {
      await axios.put('http://localhost/api/admin/settings', formData, {
        headers: { 'Accept': 'application/json' },
      });
      alert('予約受付ルールを保存しました！');
    } catch (error) {
      alert('保存に失敗しました。');
      console.error(error);
    }
  };

  if (isLoading) return <div className="p-4 text-slate-500">読み込み中...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-2 gap-4 sm:gap-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">予約受付ルールの設定</h2>
          <p className="text-sm text-slate-500 mt-1">直前予約を防ぐための締め切りタイミングを設定します。</p>
        </div>
        <Button onClick={handleSave} colorClass="bg-blue-600 hover:bg-blue-700 py-2 px-6 text-sm shadow-sm font-bold">
          設定を保存する
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        
        {/* パターンA：時間ベースの設定 */}
        <label 
          className={`block border-2 rounded-xl p-5 cursor-pointer transition-colors ${
            formData.booking_deadline_type === 'time_based' 
              ? 'border-blue-500 bg-blue-50/30' 
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="shrink-0 mt-1">
              <input 
                type="radio" 
                name="deadline_type" 
                value="time_based"
                checked={formData.booking_deadline_type === 'time_based'}
                onChange={() => setFormData({...formData, booking_deadline_type: 'time_based'})}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-800 text-lg">来店時間の〇時間前まで（当日予約OK）</div>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                当日の空き枠を活用したい場合におすすめの設定です。
              </p>
              
              {/* 選択されている時だけ入力欄を濃く表示するUI */}
              <div className={`flex items-center space-x-2 transition-opacity ${formData.booking_deadline_type === 'time_based' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <span className="font-medium text-slate-700">来店時間の</span>
                <input 
                  type="number" 
                  min="0"
                  value={formData.booking_deadline_hours}
                  onChange={e => setFormData({...formData, booking_deadline_hours: Number(e.target.value)})}
                  className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="font-medium text-slate-700">時間前まで受付</span>
              </div>
            </div>
          </div>
        </label>

        {/* パターンB：日付ベースの設定 */}
        <label 
          className={`block border-2 rounded-xl p-5 cursor-pointer transition-colors ${
            formData.booking_deadline_type === 'date_based' 
              ? 'border-blue-500 bg-blue-50/30' 
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="shrink-0 mt-1">
              <input 
                type="radio" 
                name="deadline_type" 
                value="date_based"
                checked={formData.booking_deadline_type === 'date_based'}
                onChange={() => setFormData({...formData, booking_deadline_type: 'date_based'})}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-800 text-lg">〇日前の〇時まで（当日予約NG）</div>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                前日までにスタッフのシフトや準備を完全に確定させたい場合におすすめです。
              </p>
              
              <div className={`flex flex-wrap items-center gap-2 transition-opacity ${formData.booking_deadline_type === 'date_based' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <span className="font-medium text-slate-700">来店日の</span>
                <input 
                  type="number" 
                  min="0"
                  value={formData.booking_deadline_days}
                  onChange={e => setFormData({...formData, booking_deadline_days: Number(e.target.value)})}
                  className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="font-medium text-slate-700">日前の</span>
                <input 
                  type="time" 
                  value={formData.booking_deadline_time}
                  onChange={e => setFormData({...formData, booking_deadline_time: e.target.value})}
                  className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="font-medium text-slate-700">まで受付</span>
              </div>
            </div>
          </div>
        </label>

      </div>
    </div>
  );
};