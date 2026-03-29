import { useState } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminCalendar = () => {
  // ▼ 追加：クリックされた予約データを保持するState（nullならドロワーは閉じる）
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const days = ['月', '火', '水', '木', '金', '土', '日'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const mockBookings = [
    { id: 1, dayIndex: 1, hour: 10, ref: 'BKG-A1B2C', name: '山田 太郎', menu: 'カット＆カラー', duration: 120, status: 'confirmed', memo: '前回はアッシュ系。頭皮が少し敏感なので注意。' },
    { id: 2, dayIndex: 3, hour: 14, ref: 'BKG-D3E4F', name: '佐藤 花子', menu: 'パーマ', duration: 90, status: 'confirmed', memo: '' },
    { id: 3, dayIndex: 5, hour: 11, ref: 'BKG-G5H6I', name: '鈴木 一郎', menu: 'カット', duration: 60, status: 'cancelled', memo: '体調不良のためキャンセルの電話あり' },
    { id: 4, dayIndex: 6, hour: 15, ref: 'BKG-J7K8L', name: '田中 美咲', menu: 'トリートメント', duration: 60, status: 'confirmed', memo: '' },
  ];

  return (
    <AdminLayout>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden">
        
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-xl z-20">
          <h2 className="text-xl font-bold text-slate-800">予約カレンダー（今週）</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 font-bold transition">前の週</button>
            <button className="px-3 py-1 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 font-bold transition">次の週</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-slate-50 relative">
          <div className="min-w-200 bg-white">
            
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 sticky top-0 z-10 bg-white shadow-sm">
              <div className="border-r border-slate-200 p-2"></div>
              {days.map((day, index) => (
                <div key={index} className="text-center py-3 border-r border-slate-200 font-bold text-slate-600">
                  {day}
                </div>
              ))}
            </div>

            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100">
                <div className="text-right pr-2 py-4 border-r border-slate-200 text-xs text-slate-400 font-medium">
                  {hour}:00
                </div>
                
                {days.map((_, dayIndex) => {
                  const booking = mockBookings.find(b => b.dayIndex === dayIndex && b.hour === hour);

                  return (
                    <div 
                      key={dayIndex} 
                      className="border-r border-slate-100 relative h-20 hover:bg-blue-50/30 transition-colors"
                      // 空のマスをクリックしたときは「新規作成」用にドロワーを開く（今回はモックなので仮の空データ）
                      onClick={() => !booking && setSelectedBooking({ isNew: true, hour, dayIndex })}
                    >
                      {booking && (
                        <div 
                          // ▼ 追加：予約ブロックをクリックしたときにStateにデータをセットしてドロワーを開く
                          onClick={(e) => {
                            e.stopPropagation(); // 親のクリックイベント(新規作成)を止める
                            setSelectedBooking(booking);
                          }}
                          className={`absolute left-1 right-1 rounded p-2 shadow-sm border-l-4 cursor-pointer hover:brightness-95 transition-all overflow-hidden ${
                            booking.status === 'cancelled' ? 'bg-slate-100 border-slate-400 text-slate-500' : 'bg-blue-100 border-blue-500 text-blue-800'
                          }`}
                          style={{ top: '0px', height: `${(booking.duration / 60) * 80}px`, zIndex: 5 }}
                        >
                          <div className="font-bold text-xs truncate">{booking.hour}:00 - {booking.name}様</div>
                          <div className="text-[10px] truncate opacity-80 mt-1">{booking.menu}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ==========================================
            タスク4: スライドドロワー（編集・詳細画面）
            ========================================== */}
        {/* 背景の暗転（オーバーレイ） */}
        <div 
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            selectedBooking ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          onClick={() => setSelectedBooking(null)} // 背景クリックで閉じる
        />

        {/* ドロワー本体 */}
        <div 
          className={`absolute top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
            selectedBooking ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* ヘッダー */}
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800">
              {selectedBooking?.isNew ? '新規予約の登録' : '予約詳細・編集'}
            </h3>
            <button 
              onClick={() => setSelectedBooking(null)}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              ✕ 閉じる
            </button>
          </div>

          {/* メイン領域（推論した通り、ここだけ縦スクロールさせる） */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!selectedBooking?.isNew && (
              <div className="bg-slate-100 p-3 rounded text-sm text-slate-600 font-mono">
                予約番号: {selectedBooking?.ref}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">お名前</label>
              <input type="text" className="w-full border rounded px-3 py-2" defaultValue={selectedBooking?.name || ''} />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">メニュー</label>
              <select className="w-full border rounded px-3 py-2" defaultValue={selectedBooking?.menu || ''}>
                <option>カット</option>
                <option>カット＆カラー</option>
                <option>パーマ</option>
                <option>トリートメント</option>
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-1">開始時間</label>
                <input type="time" className="w-full border rounded px-3 py-2" defaultValue={`${String(selectedBooking?.hour || 9).padStart(2, '0')}:00`} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-1">所要時間（分）</label>
                <input type="number" className="w-full border rounded px-3 py-2" defaultValue={selectedBooking?.duration || 60} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">ステータス</label>
              <select className="w-full border rounded px-3 py-2" defaultValue={selectedBooking?.status || 'confirmed'}>
                <option value="confirmed">予約確定</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>

            {/* 店舗用メモ欄 */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">店舗用メモ（お客様には非公開）</label>
              <textarea 
                className="w-full border rounded px-3 py-2 h-24 resize-none" 
                placeholder="お客様の要望や引き継ぎ事項を入力"
                defaultValue={selectedBooking?.memo || ''}
              />
            </div>
          </div>

          {/* フッター（アクションボタン領域：推論通り常に最下部に固定） */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            <button className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition shadow-sm">
              変更を保存する
            </button>
            
            {/* 事実としていただいた、破壊的アクション（赤ボタン） */}
            {!selectedBooking?.isNew && (
              <button className="w-full py-2 border border-red-500 text-red-600 rounded font-bold hover:bg-red-50 transition">
                この予約をキャンセルする
              </button>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};