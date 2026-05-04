import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import axios from '../axios';
import { useForm } from 'react-hook-form';
import 'react-calendar/dist/Calendar.css';
import type { Menu, SurveyQuestion } from '../types';

// フォームで入力してもらうデータの型定義
interface BookingFormData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_memo?: string;
  terms_accepted: boolean;
  // アンケートの項目は数が決まっていないため、どんなキー名(string)でも受け入れる設定にする
  [key: string]: any;
}

export const BookingWizard = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [completedBookingRef, setCompletedBookingRef] = useState<string | null>(null); 
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [termsText, setTermsText] = useState<string | null>(null);

  // React Hook Form の準備
  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormData>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menusRes, surveyRes, settingsRes] = await Promise.all([
          axios.get('/menus'),
          axios.get('/survey-questions'),
          axios.get('/settings')
        ]);
        
        setMenus(menusRes.data.menus || menusRes.data || []);
        
        const formattedSurvey = surveyRes.data.map((q: SurveyQuestion) => ({
          ...q,
          options: q.options || []
        }));
        setSurveyQuestions(formattedSurvey);

        setTermsText(settingsRes.data.terms_text);
        
      } catch (error) {
        console.error('データの取得に失敗しました', error);
      }
    };
    fetchData();
  }, []);

  const handleDateChange = async (value: Date | [Date | null, Date | null] | null) => {
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
      const response = await axios.get(`/available-slots`, {
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

    // 動的アンケートの回答をキレイなオブジェクトにまとめる
    const formattedSurveyResponses: Record<string, any> = {};
    surveyQuestions.forEach(q => {
      // フォームの入力データから "survey_1" などのキーを探す
      const answer = data[`survey_${q.id}`];
      if (answer) {
        // 例: {"来店回数は？": "初めて"} という形にして保存する（後から見やすいため）
        formattedSurveyResponses[q.question_text] = answer;
      }
    });

    // 2. 送信データ（Payload）の作成（※料金などは送らない！）
    const payload = {
      menu_id: selectedMenu.id,
      start_time: startTime,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      customer_memo: data.customer_memo || null,
      survey_responses: formattedSurveyResponses, // まとめたアンケート結果を送信
    };

    try {
      // 3. APIへPOST送信！
      const response = await axios.post('/bookings', payload);
      
      // 成功したら、予約番号をセットして完了画面に切り替える
      setCompletedBookingRef(response.data.booking.booking_reference);
      
    } catch (error: any) {
      // 4. 429エラー（レートリミット）のハンドリング
      if (error.response && error.response.status === 429) {
        alert('アクセスが集中しているか、操作が早すぎます。1分ほどお待ちいただいてから再度お試しください。');
        return;
      }

      // 5. 409エラー時のUX
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

            {/* 動的アンケートの描画ロジック ▼ */}
            {surveyQuestions.length > 0 && (
              <div className="bg-white p-5 rounded border mt-6 shadow-sm">
                <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">店舗からのアンケート</h4>
                
                <div className="space-y-6">
                  {surveyQuestions.map(q => (
                    <div key={q.id}>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {q.question_text}
                        {q.is_required && <span className="text-red-500 ml-1">*</span>}
                        {q.type === 'checkbox' && <span className="text-xs text-gray-400 font-normal ml-2">※複数選択可</span>}
                      </label>
                      
                      {/* テキスト入力 */}
                      {q.type === 'text' && (
                        <input 
                          type="text"
                          {...register(`survey_${q.id}`, { required: q.is_required ? '必須項目です' : false })}
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                          placeholder="ご自由にご記入ください"
                        />
                      )}

                      {/* ラジオボタン */}
                      {q.type === 'radio' && (
                        <div className="flex flex-wrap gap-4">
                          {q.options.map((opt, index) => (
                            <label key={index} className="flex items-center cursor-pointer bg-slate-50 border rounded px-3 py-2 hover:bg-slate-100 transition">
                              <input 
                                type="radio" 
                                value={opt} 
                                {...register(`survey_${q.id}`, { required: q.is_required ? '必須項目です' : false })} 
                                className="mr-2 text-blue-600 focus:ring-blue-500" 
                              />
                              <span className="text-sm">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* チェックボックス */}
                      {q.type === 'checkbox' && (
                        <div className="flex flex-wrap gap-4">
                          {q.options.map((opt, index) => (
                            <label key={index} className="flex items-center cursor-pointer bg-slate-50 border rounded px-3 py-2 hover:bg-slate-100 transition">
                              <input 
                                type="checkbox" 
                                value={opt} 
                                {...register(`survey_${q.id}`, { required: q.is_required ? '必須項目です' : false })} 
                                className="mr-2 rounded text-blue-600 focus:ring-blue-500" 
                              />
                              <span className="text-sm">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {/* エラーメッセージ（必須なのに未入力の時） */}
                      {errors[`survey_${q.id}`] && (
                        <p className="text-red-500 text-xs mt-1">{(errors[`survey_${q.id}`] as any).message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 利用規約の同意 UI ▼ */}
            {/* termsTextが存在し、かつ空文字でない場合のみ表示 */}
            {termsText && termsText.trim() !== '' && (
              <div className="bg-white p-5 rounded border mt-6 shadow-sm">
                <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">利用規約の確認</h4>
                
                {/* 規約テキストの表示エリア（スクロール可能にする） */}
                <div className="bg-slate-50 border rounded p-4 h-40 overflow-y-auto mb-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {termsText}
                </div>

                {/* 同意チェックボックス（requiredで縛る） */}
                <div>
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="checkbox"
                      {...register('terms_accepted', { required: '予約を進めるには利用規約への同意が必要です。' })}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-3"
                    />
                    <span className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      利用規約に同意する <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {errors.terms_accepted && (
                    <p className="text-red-500 text-xs mt-2 ml-8">{errors.terms_accepted.message}</p>
                  )}
                </div>
              </div>
            )}

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