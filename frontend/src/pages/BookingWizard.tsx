import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import { useForm } from 'react-hook-form'; // 👈 追加
import 'react-calendar/dist/Calendar.css';

interface Menu {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
}

// フォームで入力してもらうデータの型定義
interface BookingFormData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_memo?: string;
  survey_is_first_time?: string; // アンケート1: 初めてか
  survey_hear_about_us?: string; // アンケート2: 認知経路
}

export const BookingWizard = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  // ▼ 新しく追加する状態（State） ▼
  const [selectedTime, setSelectedTime] = useState<string | null>(null); // 選んだ時間
  const [isSubmitting, setIsSubmitting] = useState(false); // 送信中（ローディング）判定
  const [completedBookingRef, setCompletedBookingRef] = useState<string | null>(null); // 完了時の予約番号

  // React Hook Form の準備
  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormData>();

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await axios.get('http://localhost/api/menus');
        setMenus(response.data.menus || response.data || []);
      } catch (error) {
        console.error('メニューの取得に失敗しました', error);
      }
    };
    fetchMenus();
  }, []);

  const handleDateChange = async (value: any) => {
    const date = value as Date;
    setSelectedDate(date);
    setSelectedTime(null); // 日付を変えたら選んだ時間はリセットする
    
    if (!selectedMenu) {
      alert('先にメニューを選択してください');
      return;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    try {
      const response = await axios.get(`http://localhost/api/available-slots`, {
        params: { date: dateString, menu_id: selectedMenu.id }
      });
      setAvailableSlots(response.data.available_slots || response.data || []);
    } catch (error) {
      console.error('空き時間の取得に失敗しました', error);
    }
  };

  // ▼ 予約実行処理（handleSubmitから呼ばれる） ▼
  const onSubmit = async (data: BookingFormData) => {
    if (!selectedMenu || !selectedDate || !selectedTime) return;

    setIsSubmitting(true); // ボタンを「送信中...」にする

    // 1. 日付と時間を合体させて、Laravelが求める `start_time` を作る
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const startTime = `${year}-${month}-${day} ${selectedTime}:00`;

    // 2. 送信データ（Payload）の作成（※料金などは送らない！）
    const payload = {
      menu_id: selectedMenu.id,
      start_time: startTime,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      customer_memo: data.customer_memo || null,
      survey_responses: {
        is_first_time: data.survey_is_first_time || '',
        hear_about_us: data.survey_hear_about_us || '',
      }
    };

    try {
      // 3. APIへPOST送信！
      const response = await axios.post('http://localhost/api/bookings', payload);
      
      // 成功したら、予約番号をセットして完了画面に切り替える
      setCompletedBookingRef(response.data.booking.booking_reference);
      
    } catch (error: any) {
      // 4. 【推論実装】409エラー時のUX
      if (error.response && error.response.status === 409) {
        alert('申し訳ありません！タッチの差でこの時間は埋まってしまいました。別の時間をお選びください。');
        // 現在選ばれている日付をそのまま渡して、空き時間再取得APIをもう一度叩き直す！
        // （handleDateChangeの中で setSelectedTime(null) も実行されるため一石二鳥です）
        if (selectedDate) {
          handleDateChange(selectedDate);
        }
      } else {
        alert('予約の保存に失敗しました。入力内容をご確認ください。');
      }
    } finally {
      setIsSubmitting(false); // ローディング解除
    }
  };

  // ==========================================
  // 画面描画（UI）
  // ==========================================

  // 予約完了している場合は、完了画面（サンクスページ）を表示
  if (completedBookingRef) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-sm mt-8 text-center">
        <div className="text-green-500 text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">ご予約が完了しました！</h2>
        <p className="mb-6 text-gray-600">ご登録いただいたメールアドレスに詳細をお送りしました。</p>
        <div className="bg-gray-50 p-6 rounded-lg mb-8 inline-block text-left border">
          <p className="text-sm text-gray-500 mb-1">予約照会番号</p>
          <p className="text-2xl font-mono font-bold text-blue-600 tracking-wider">{completedBookingRef}</p>
          <p className="text-xs text-red-500 mt-2">※キャンセル時に必要になります。必ずお控えください。</p>
        </div>
        <div>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-600 hover:underline"
          >
            トップページへ戻る
          </button>
        </div>
      </div>
    );
  }

  // 通常の予約ウィザード画面
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm mt-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">新規ご予約</h2>

      {/* --- Step 1: メニュー --- */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">Step 1: メニューを選ぶ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menus.map((menu) => (
            <div 
              key={menu.id}
              onClick={() => setSelectedMenu(menu)}
              className={`p-4 border rounded-lg cursor-pointer transition ${
                selectedMenu?.id === menu.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="font-bold">{menu.name}</div>
              <div className="text-sm text-gray-600">¥{menu.price.toLocaleString()} / {menu.duration_minutes}分</div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Step 2: 日付と時間 --- */}
      <div className="mb-8 opacity-100 transition-opacity duration-500">
        <h3 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">Step 2: 日付と時間を選ぶ</h3>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <Calendar 
              onChange={handleDateChange} 
              value={selectedDate}
              minDate={new Date()}
              className="border-none shadow-sm rounded-lg p-2"
            />
          </div>
          <div className="flex-1">
            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <button 
                    key={slot}
                    className={`py-2 border rounded transition ${
                      selectedTime === slot ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-blue-50'
                    }`}
                    onClick={() => setSelectedTime(slot)} // 選んだ時間をStateに保存
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : selectedDate ? (
              <p className="text-red-500">この日は空きがありません。</p>
            ) : (
              <p className="text-gray-400 text-sm">カレンダーから日付を選択してください。</p>
            )}
          </div>
        </div>
      </div>

      {/* --- Step 3: お客様情報（時間が選ばれたら表示される） --- */}
      {selectedTime && (
        <div className="mb-8 animate-fade-in-up">
          <h3 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">Step 3: お客様情報の入力</h3>
          
          {/* React Hook Form の handleSubmit で onSubmit を包む */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-gray-50 p-6 rounded-lg border">
            
            {/* 名前入力 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">お名前 <span className="text-red-500">*</span></label>
              <input 
                {...register('customer_name', { required: 'お名前は必須です' })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="例: 山田 太郎"
              />
              {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name.message}</p>}
            </div>

            {/* メールアドレス入力 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
              <input 
                {...register('customer_email', { 
                  required: 'メールアドレスは必須です',
                  pattern: { value: /^\S+@\S+$/i, message: '正しいメールアドレス形式で入力してください' }
                })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="例: taro@example.com"
              />
              {errors.customer_email && <p className="text-red-500 text-xs mt-1">{errors.customer_email.message}</p>}
            </div>

            {/* 電話番号入力（任意） */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">電話番号<span className="text-red-500">*</span></label>
              <input 
                {...register('customer_phone', { required: '電話番号は必須です' })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="例: 090-1234-5678"
              />
            </div>

            {/* ▼ ここから追加：お客様メモ ▼ */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">ご要望・メモ（任意）</label>
              <textarea 
                {...register('customer_memo')}
                rows={3}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="アレルギーや、事前に伝えておきたいことなどをご記入ください"
              />
            </div>

            {/* ▼ ここから追加：アンケート ▼ */}
            <div className="bg-white p-4 rounded border mt-4 shadow-sm">
              <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">ご来店に関するアンケート（任意）</h4>
              
              <div className="space-y-4">
                {/* 質問1：ラジオボタン */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">当店のご利用は初めてですか？</label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" value="yes" {...register('survey_is_first_time')} className="mr-2" />
                      はい
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" value="no" {...register('survey_is_first_time')} className="mr-2" />
                      いいえ
                    </label>
                  </div>
                </div>

                {/* 質問2：セレクトボックス */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">何を見て当店をお知りになりましたか？</label>
                  <select 
                    {...register('survey_hear_about_us')}
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">選択してください</option>
                    <option value="web">Web検索</option>
                    <option value="sns_instagram">Instagram</option>
                    <option value="sns_twitter">X (Twitter)</option>
                    <option value="friend">知人の紹介</option>
                    <option value="other">その他</option>
                  </select>
                </div>
              </div>
            </div>
            {/* ▲ ここまで追加 ▲ */}

            {/* 確定ボタン */}
            <div className="pt-4 text-center">
              <button 
                type="submit" 
                disabled={isSubmitting} // 送信中は連打できないように無効化
                className={`w-full md:w-auto px-8 py-3 rounded-full font-bold text-white transition-all ${
                  isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
                }`}
              >
                {isSubmitting ? '予約処理中...' : 'この内容で予約を確定する'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};