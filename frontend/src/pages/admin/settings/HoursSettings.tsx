import { useState, useEffect } from 'react';
// 設定済みの専用Axiosを呼ぶ
import axios from '../../../axios';
import { Button } from '../../../components/Button';

// APIとやり取りするデータの型定義
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

// 曜日マスターデータ
const DAYS_OF_WEEK = [
  { key: 'monday', label: '月曜日' },
  { key: 'tuesday', label: '火曜日' },
  { key: 'wednesday', label: '水曜日' },
  { key: 'thursday', label: '木曜日' },
  { key: 'friday', label: '金曜日' },
  { key: 'saturday', label: '土曜日' },
  { key: 'sunday', label: '日曜日' },
] as const;

export const HoursSettings = () => {
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

  // 1. 初回マウント時に設定を取得
  const fetchSettings = async () => {
    try {
      const res = await axios.get('/admin/settings');
      // DBから取得した時刻は "10:00:00" のように秒が含まれるため、先頭5文字("10:00")だけ切り取る
      setFormData({
        open_time: res.data.open_time.substring(0, 5),
        close_time: res.data.close_time.substring(0, 5),
        regular_holidays: res.data.regular_holidays || [],
        terms_text: res.data.terms_text || '',
        booking_deadline_type: res.data.booking_deadline_type || 'time_based',
        booking_deadline_hours: res.data.booking_deadline_hours ?? 2,
        booking_deadline_days: res.data.booking_deadline_days ?? 1,
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

  // 2. 定休日のチェックボックス切り替え処理
  const handleHolidayToggle = (dayKey: string) => {
    setFormData(prev => {
      const isCurrentlyHoliday = prev.regular_holidays.includes(dayKey);
      return {
        ...prev,
        regular_holidays: isCurrentlyHoliday
          ? prev.regular_holidays.filter(d => d !== dayKey) // チェック外す（配列から削除）
          : [...prev.regular_holidays, dayKey] // チェック入れる（配列に追加）
      };
    });
  };

  // 3. 保存処理
  const handleSave = async () => {
    try {
      await axios.put('/admin/settings', formData, {
        headers: { 'Accept': 'application/json' },
      });
      alert('店舗設定を保存しました！');
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
          <h2 className="text-xl font-bold text-slate-800">店舗基本設定</h2>
          <p className="text-sm text-slate-500 mt-1">営業時間や定休日、利用規約を設定します。</p>
        </div>
        <Button onClick={handleSave} colorClass="bg-blue-600 hover:bg-blue-700 py-2 px-6 text-sm shadow-sm font-bold">
          設定を保存する
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
        
        {/* 営業時間設定 */}
        <section>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-2">1</span>
            営業時間
          </h3>
          <div className="flex items-center space-x-4">
            <div>
              <input 
                type="time" 
                value={formData.open_time}
                onChange={e => setFormData({...formData, open_time: e.target.value})}
                className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <span className="font-bold text-slate-400">〜</span>
            <div>
              <input 
                type="time" 
                value={formData.close_time}
                onChange={e => setFormData({...formData, close_time: e.target.value})}
                className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>
        </section>

        <hr className="border-slate-100" />

        {/* 定休日設定 */}
        <section>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-2">2</span>
            定休日の設定
          </h3>
          <div className="flex flex-wrap gap-4">
            {DAYS_OF_WEEK.map(day => (
              <label key={day.key} className="flex items-center space-x-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.regular_holidays.includes(day.key)}
                  onChange={() => handleHolidayToggle(day.key)}
                  className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className={`font-medium ${formData.regular_holidays.includes(day.key) ? 'text-slate-800' : 'text-slate-500 group-hover:text-slate-700'}`}>
                  {day.label}
                </span>
              </label>
            ))}
          </div>
        </section>

        <hr className="border-slate-100" />

        {/* 利用規約設定 */}
        <section>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-2">3</span>
            利用規約テキスト
          </h3>
          <p className="text-sm text-slate-500 mb-3">
            お客様が予約を確定する前に同意を求める規約文を入力してください。
          </p>
          <textarea 
            rows={8}
            value={formData.terms_text}
            onChange={e => setFormData({...formData, terms_text: e.target.value})}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed text-slate-700"
            placeholder="利用規約を入力..."
          />
        </section>

      </div>
    </div>
  );
};