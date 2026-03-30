import { useState } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminSettings = () => {
  //  どの設定メニューが開かれているかを管理するState
  const [activeTab, setActiveTab] = useState('hours');

  // サイドバーのメニューリスト（次回のCard 13で作る項目もリストに入れておきます）
  const menuItems = [
    { id: 'hours', label: '営業時間・休業日設定' },
    { id: 'period', label: '予約受付期間の設定' },
    { id: 'survey', label: '予約時アンケート設定' },
    { id: 'terms', label: '規約設定' },
    // ▼以下はCard 13で実装予定
    { id: 'menus', label: 'メニュー登録 (次回実装)' },
    { id: 'staff', label: 'スタッフ登録 (次回実装)' },
    { id: 'resource', label: 'リソース管理 (次回実装)' },
  ];

  // 定休日設定用の曜日配列
  const daysOfWeek = ['月', '火', '水', '木', '金', '土', '日'];

  return (
    <AdminLayout>
       <div className="flex flex-col md:flex-row gap-6">
         
         {/* ==========================================
             左サイドバー（ナビゲーション）
             ========================================== */}
         <div className="w-full md:w-64 shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
            <nav className="flex flex-col">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)} // クリックでStateを切り替え！
                  className={`text-left px-6 py-4 border-b border-slate-100 font-bold transition-colors ${
                    activeTab === item.id 
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-l-blue-600' // アクティブ時のデザイン
                      : 'text-slate-600 hover:bg-slate-50' // 非アクティブ時
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
         </div>

         {/* ==========================================
             右メインコンテンツ（条件分岐で中身を切り替え）
             ========================================== */}
         <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 min-h-125">
           
           {/* ▼ 1. 営業時間・休業日設定 ▼ */}
           {activeTab === 'hours' && (
             <div className="space-y-8 animate-fade-in">
               <h2 className="text-xl font-bold text-slate-800 border-b pb-2">営業時間・休業日設定</h2>

               {/* 追加要件：営業日・休業日の設定UI */}
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-3">定休日の設定</label>
                 <div className="flex flex-wrap gap-2">
                   {daysOfWeek.map(day => (
                     <label key={day} className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded cursor-pointer hover:bg-slate-100 transition-colors">
                       <input type="checkbox" className="w-4 h-4 text-blue-600 cursor-pointer" defaultChecked={day === '火'} />
                       <span className="font-bold text-slate-700">{day}曜日</span>
                     </label>
                   ))}
                 </div>
                 <p className="text-xs text-slate-500 mt-2">※チェックを入れた曜日は「定休日」となり、カレンダー上で予約不可になります。</p>
               </div>

               {/* 営業時間設定 UI */}
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-3">基本営業時間</label>
                 <div className="flex items-center space-x-4">
                   <select className="border border-slate-300 rounded px-4 py-2 bg-white text-slate-700 font-bold" defaultValue="09:00">
                     <option value="09:00">09:00</option>
                     <option value="10:00">10:00</option>
                   </select>
                   <span className="font-bold text-slate-500">〜</span>
                   {/* 開始時間より前の時間は選べない想定 */}
                   <select className="border border-slate-300 rounded px-4 py-2 bg-white text-slate-700 font-bold" defaultValue="18:00">
                     <option value="18:00">18:00</option>
                     <option value="19:00">19:00</option>
                     <option value="20:00">20:00</option>
                   </select>
                 </div>
               </div>

               <button className="bg-slate-800 text-white font-bold py-3 px-8 rounded hover:bg-slate-700 transition shadow-sm">
                 設定を保存する
               </button>
             </div>
           )}

           {/* ▼ 2. 予約受付期間の設定 ▼ */}
           {activeTab === 'period' && (
             <div className="space-y-6 animate-fade-in">
               <h2 className="text-xl font-bold text-slate-800 border-b pb-2">予約受付期間の設定</h2>
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">何日先まで予約を受け付けますか？</label>
                 <div className="flex items-center space-x-2">
                   <input type="number" defaultValue={30} className="border border-slate-300 rounded px-4 py-2 w-24 text-right font-bold text-slate-700" />
                   <span className="font-bold text-slate-700">日後まで</span>
                 </div>
                 <p className="text-xs text-slate-500 mt-2">例：30日後に設定すると、今日から約1ヶ月先までのカレンダーがお客様に公開されます。</p>
               </div>
               <button className="bg-slate-800 text-white font-bold py-3 px-8 rounded hover:bg-slate-700 transition shadow-sm">設定を保存する</button>
             </div>
           )}

           {/* ▼ 3. 予約時アンケート設定 ▼ */}
           {activeTab === 'survey' && (
             <div className="space-y-6 animate-fade-in">
               <h2 className="text-xl font-bold text-slate-800 border-b pb-2">予約時アンケート設定</h2>
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">お客様への質問事項</label>
                 <input type="text" defaultValue="来店時のご要望や、髪の悩みなどがあればご記入ください。" className="w-full border border-slate-300 rounded px-4 py-2 text-slate-700" />
                 <p className="text-xs text-slate-500 mt-2">※お客様が予約する際の最終確認画面に表示される入力フォームのラベルになります。</p>
               </div>
               <div className="flex items-center space-x-2 mt-4 bg-slate-50 p-4 rounded border border-slate-200">
                 <input type="checkbox" id="required" className="w-5 h-5 cursor-pointer" />
                 <label htmlFor="required" className="font-bold text-slate-700 cursor-pointer">このアンケートを「必須回答」にする</label>
               </div>
               <button className="bg-slate-800 text-white font-bold py-3 px-8 rounded hover:bg-slate-700 transition shadow-sm">設定を保存する</button>
             </div>
           )}

           {/* ▼ 4. 規約設定 ▼ */}
           {activeTab === 'terms' && (
             <div className="space-y-6 animate-fade-in">
               <h2 className="text-xl font-bold text-slate-800 border-b pb-2">規約・キャンセルポリシー設定</h2>
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">利用規約テキスト</label>
                 <textarea 
                   className="w-full border border-slate-300 rounded px-4 py-3 h-48 resize-y text-slate-700 leading-relaxed" 
                   defaultValue={"1. キャンセルは予約の24時間前までにお願いいたします。\n2. 無断キャンセルの場合は、次回以降のご予約をお断りする場合がございます。\n3. 予約時間を15分過ぎてもご来店がない場合は、自動的にキャンセル扱いとなります。"}
                 />
                 <p className="text-xs text-slate-500 mt-2">※予約確定前に、お客様に同意していただくための規約テキストです。</p>
               </div>
               <button className="bg-slate-800 text-white font-bold py-3 px-8 rounded hover:bg-slate-700 transition shadow-sm">規約を保存する</button>
             </div>
           )}

           {/* ▼ 次回のCard 13のプレースホルダー ▼ */}
           {['menus', 'staff', 'resource'].includes(activeTab) && (
             <div className="py-24 text-center text-slate-500 flex flex-col items-center animate-fade-in">
               <span className="text-5xl mb-4">🚧</span>
               <p className="font-bold text-xl mb-2 text-slate-700">この機能は次のカード（Card 13）で実装します</p>
               <p className="text-sm">メニューやスタッフの管理UIをお楽しみに！</p>
             </div>
           )}

         </div>
       </div>
    </AdminLayout>
  );
};