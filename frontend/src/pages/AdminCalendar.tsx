import { useState, useEffect } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import axios from 'axios';

// 曜日の文字列をFullCalendar用の数値(0=日曜日)に変換するマップ
const dayMap: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
};

export const AdminCalendar = () => {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [storeSettings, setStoreSettings] = useState<any>(null);

  // 1. 初回マウント時に「店舗設定（営業時間・定休日）」を取得する
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('http://localhost/api/admin/settings');
        setStoreSettings(res.data);
      } catch (error) {
        console.error('設定の取得に失敗しました', error);
      }
    };
    fetchSettings();
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

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!selectedBooking?.isNew && (
              <div className="bg-slate-100 p-3 rounded text-sm text-slate-600 font-mono flex justify-between items-center">
                <span>予約番号: {selectedBooking?.booking_reference}</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${selectedBooking?.status === 'cancelled' ? 'bg-slate-200 text-slate-600' : 'bg-green-100 text-green-700'}`}>
                  {selectedBooking?.status === 'cancelled' ? 'キャンセル済' : '予約確定'}
                </span>
              </div>
            )}

            {/* お客様情報 */}
            <div className="bg-white border rounded-lg p-4 space-y-3">
              <h4 className="font-bold text-slate-700 border-b pb-2">お客様情報</h4>
              <div>
                <label className="block text-xs text-slate-500 mb-1">お名前</label>
                <input type="text" className="w-full border rounded px-3 py-2 font-bold" defaultValue={selectedBooking?.customer_name || ''} readOnly />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">電話番号</label>
                  <input type="text" className="w-full border rounded px-3 py-2 text-sm" defaultValue={selectedBooking?.customer_phone || ''} readOnly />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">メール</label>
                  <input type="text" className="w-full border rounded px-3 py-2 text-sm" defaultValue={selectedBooking?.customer_email || ''} readOnly />
                </div>
              </div>
            </div>

            {/* 予約内容 */}
            <div className="bg-white border rounded-lg p-4 space-y-3">
              <h4 className="font-bold text-slate-700 border-b pb-2">予約内容</h4>
              <div>
                <label className="block text-xs text-slate-500 mb-1">メニュー</label>
                <input type="text" className="w-full border rounded px-3 py-2 font-bold" defaultValue={selectedBooking?.menu?.name || ''} readOnly />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">担当スタッフ</label>
                <input type="text" className="w-full border rounded px-3 py-2" defaultValue={selectedBooking?.staff?.name || ''} readOnly />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">開始時間</label>
                  <input type="text" className="w-full border rounded px-3 py-2" defaultValue={selectedBooking?.start_time ? new Date(selectedBooking.start_time).toLocaleString('ja-JP') : ''} readOnly />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">終了時間</label>
                  <input type="text" className="w-full border rounded px-3 py-2" defaultValue={selectedBooking?.end_time ? new Date(selectedBooking.end_time).toLocaleString('ja-JP') : ''} readOnly />
                </div>
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

            {/* 備考欄 */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">お客様からのご要望・メモ</label>
              <textarea 
                className="w-full border rounded px-3 py-2 h-20 resize-none bg-slate-50" 
                defaultValue={selectedBooking?.customer_memo || 'なし'}
                readOnly
              />
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
};