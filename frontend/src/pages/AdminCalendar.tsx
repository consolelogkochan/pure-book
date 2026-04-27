import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg } from '@fullcalendar/core';
// 設定済みの専用Axiosを呼ぶ
import axios from '../axios';
// 曜日の文字列をFullCalendar用の数値(0=日曜日)に変換するマップ
const dayMap: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
};

interface Menu {
  id: number;
  name: string;
  duration_minutes: number;
}

export const AdminCalendar = () => {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [menus, setMenus] = useState<Menu[]>([]);

  // ▼追加：カレンダー本体を操作するためのリモコン（Ref）
  const calendarRef = useRef<FullCalendar>(null);

  // 1. 初回マウント時に「店舗設定（営業時間・定休日）」を取得する
  useEffect(() => {
    // 店舗設定とメニュー一覧を同時に取得する
    const fetchData = async () => {
      try {
        const [settingsRes, menusRes] = await Promise.all([
          axios.get('http://localhost/api/admin/settings'),
          axios.get('http://localhost/api/menus') // お客様用APIを流用
        ]);
        setStoreSettings(settingsRes.data);
        setMenus(menusRes.data.menus || menusRes.data || []);
      } catch (error) {
        console.error('データの取得に失敗しました', error);
      }
    };
    fetchData();
  }, []);

  // 2. FullCalendarが自動で予約データを取得するための関数
  const fetchEvents = async (info: any, successCallback: any, failureCallback: any) => {
    try {
      const res = await axios.get('http://localhost/api/admin/bookings', {
        params: {
          start: info.startStr,
          end: info.endStr
        }
      });

      // Laravelから来たデータをFullCalendarのイベント形式に変換
      const events = res.data.map((booking: any) => ({
        id: booking.id,
        title: `${booking.customer_name}様`,
        start: booking.start_time,
        end: booking.end_time,
        backgroundColor: booking.status === 'cancelled' ? '#94a3b8' : '#2563eb', // キャンセルはグレー、確定は青
        borderColor: booking.status === 'cancelled' ? '#94a3b8' : '#2563eb',
        extendedProps: booking // クリックした時のために元データを丸ごと保持しておく
      }));

      successCallback(events);
    } catch (error) {
      console.error('予約データの取得に失敗しました', error);
      failureCallback(error);
    }
  };

  // ▼追加：予約の更新（編集・キャンセル）処理
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 画面の無駄なリロードを防ぐ
    
    // フォームに入力されたデータを集める
    const formData = new FormData(e.currentTarget);
    const datePart = formData.get('start_date_only');
    const timePart = formData.get('start_time_only');
    
    const payload = {
      start_time: `${datePart} ${timePart}:00`,
      menu_id: Number(formData.get('menu_id')),
      status: formData.get('status'),
      customer_name: formData.get('customer_name'), // 新規用に取得
      customer_phone: formData.get('customer_phone'), // 新規用に取得
      customer_email: formData.get('customer_email'), // 新規用に取得
      customer_memo: formData.get('customer_memo'),
    };

    try {
      if (selectedBooking.isNew) {
        await axios.post('http://localhost/api/admin/bookings', payload);
        alert('新規予約を登録しました！');
      } else {
        await axios.put(`http://localhost/api/admin/bookings/${selectedBooking.id}`, payload);
        alert('予約情報を更新しました！');
      }
      setSelectedBooking(null); // ドロワーを閉じる
      
      // ▼追加：カレンダーのデータを最新状態に再取得（リフレッシュ）させる
      if (calendarRef.current) {
        calendarRef.current.getApi().refetchEvents();
      }
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        alert(error.response.data.message); // 「この時間は予約枠が埋まっています」を表示
      } else {
        alert('更新に失敗しました。');
      }
    }
  };

  // 定休日の配列を数値の配列に変換
  const hiddenDays = storeSettings?.regular_holidays?.map((day: string) => dayMap[day]) || [];

  return (
    <AdminLayout>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden">
        
        <div className="flex-1 p-4 overflow-auto">
          <div className="min-w-200 h-full">
          {/* 設定が読み込まれるまでカレンダーは描画しない（チラつき防止） */}
          {storeSettings ? (
            // ▼追加：TypeScriptの誤検知エラーを無視させるおまじない
            // @ts-expect-error
            <FullCalendar
              ref={calendarRef} // 👈 カレンダーにリモコンをセット
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay' // 月・週・日の切り替えボタン
              }}
              locale="ja" // 日本語化
              allDaySlot={false} // 終日スロットは使わないので隠す
              slotMinTime={storeSettings.open_time} // 営業開始時間
              slotMaxTime={storeSettings.close_time} // 営業終了時間
              hiddenDays={hiddenDays} // 定休日はカレンダーから完全に消す
              events={fetchEvents} // データの取得関数をセット
              selectable={true} // カレンダーの空き枠を選択可能にする
              // 空き枠が選択（クリック）されたら、isNew: true でドロワーを開く
              select={(info: DateSelectArg) => {
                setSelectedBooking({
                  isNew: true,
                  start_time: info.startStr, // クリックした日時を初期値にする
                });
              }}
              eventClick={(info: EventClickArg) => {
                // イベントをクリックしたら、保持していた元データ(extendedProps)をStateに入れる
                setSelectedBooking({
                  isNew: false,
                  ...info.event.extendedProps
                });
              }}
              height="100%"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">カレンダーを読み込み中...</div>
          )}
          </div>
        </div>

        {/* --- 詳細・編集ドロワー --- */}
        <div 
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            selectedBooking ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          onClick={() => setSelectedBooking(null)} 
        />

        <div 
          className={`absolute top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
            selectedBooking ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800">
              {selectedBooking?.isNew ? '新規予約の登録' : '予約詳細・編集'}
            </h3>
            <button 
              onClick={() => setSelectedBooking(null)}
              className="text-slate-400 hover:text-slate-600 transition font-bold"
            >
              ✕ 閉じる
            </button>
          </div>
          {/* 全体を <form> で囲み、onSubmit に関数を紐付ける */}
          <form
          key={selectedBooking?.id || 'new'} 
          onSubmit={handleUpdate} 
          className="flex flex-col h-full overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!selectedBooking?.isNew && (
                <div className="bg-slate-100 p-3 rounded text-sm text-slate-600 font-mono flex justify-between items-center">
                  <span>予約番号: {selectedBooking?.booking_reference}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${selectedBooking?.status === 'cancelled' ? 'bg-slate-200 text-slate-600' : 'bg-green-100 text-green-700'}`}>
                    {selectedBooking?.status === 'cancelled' ? 'キャンセル済' : '予約確定'}
                  </span>
                </div>
              )}
              
              {/* お客様情報（変更なし、readOnlyのまま） */}
              <div className="bg-white border rounded-lg p-4 space-y-3">
                <h4 className="font-bold text-slate-700 border-b pb-2">お客様情報</h4>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">お名前</label>
                  <input name="customer_name" type="text" className="w-full border rounded px-3 py-2 font-bold" defaultValue={selectedBooking?.customer_name || ''} readOnly={!selectedBooking?.isNew} required={selectedBooking?.isNew} />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">電話番号</label>
                    <input name="customer_phone" type="text" className="w-full border rounded px-3 py-2 text-sm" defaultValue={selectedBooking?.customer_phone || ''} readOnly={!selectedBooking?.isNew} required={selectedBooking?.isNew} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">メール</label>
                    <input name="customer_email" type="email" className="w-full border rounded px-3 py-2 text-sm" defaultValue={selectedBooking?.customer_email || ''} readOnly={!selectedBooking?.isNew} required={selectedBooking?.isNew} />
                  </div>
                </div>
              </div>

              {/* 予約内容（編集可能にする） */}
              <div className="bg-white border border-blue-200 rounded-lg p-4 space-y-3">
                <h4 className="font-bold text-blue-700 border-b border-blue-100 pb-2 flex items-center">
                   予約内容の編集
                </h4>
                
                {/* メニューをセレクトボックスにする */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">メニュー</label>
                  <select 
                    name="menu_id" 
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white outline-none focus:border-blue-500" 
                    defaultValue={selectedBooking?.menu_id || ''}
                    required
                  >
                    {menus.map(menu => (
                      <option key={menu.id} value={menu.id}>
                        {menu.name} ({menu.duration_minutes}分)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1">日付</label>
                    <input 
                      name="start_date_only" 
                      type="date" 
                      className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500" 
                      defaultValue={selectedBooking?.start_time ? (selectedBooking.start_time.split('T')[0] || selectedBooking.start_time.split(' ')[0]) : ''} 
                      required 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1">開始時間</label>
                    <input 
                      name="start_time_only" 
                      type="time" 
                      className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500" 
                      defaultValue={selectedBooking?.start_time ? new Date(selectedBooking.start_time).toTimeString().substring(0, 5) : ''} 
                      required 
                    />
                  </div>
                  {/* 終了時間はバックエンドで自動計算されるため、非表示またはReadOnly表示で良いですが、今回は元のUIに合わせてテキスト表示のみにしておきます */}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">ステータス変更</label>
                  <select name="status" className="w-full border border-slate-300 rounded px-3 py-2 bg-white outline-none focus:border-blue-500" defaultValue={selectedBooking?.status || 'confirmed'}>
                    <option value="confirmed">予約確定（通常）</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                </div>
              </div>

              {/* アンケート結果の表示 */}
              {selectedBooking?.survey_responses && Object.keys(selectedBooking.survey_responses).length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
                  <h4 className="font-bold text-blue-800 border-b border-blue-200 pb-2">事前アンケート回答</h4>
                  {Object.entries(selectedBooking.survey_responses).map(([question, answer], index) => (
                    <div key={index}>
                      <p className="text-xs text-blue-600 mb-1">{question}</p>
                      <p className="text-sm font-bold text-slate-800 bg-white px-2 py-1 rounded">{String(answer)}</p>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">店舗用メモ</label>
                <textarea 
                  name="customer_memo"
                  className="w-full border rounded px-3 py-2 h-20 resize-none outline-none focus:border-blue-500" 
                  defaultValue={selectedBooking?.customer_memo || ''}
                  placeholder="お客様のご要望や、店舗側の引き継ぎ事項"
                />
              </div>

            </div>

            {/* ボタンエリア（type="submit" に変更） */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition shadow-sm">
                変更を保存する
              </button>
            </div>

          </form>

        </div>
      </div>
    </AdminLayout>
  );
};