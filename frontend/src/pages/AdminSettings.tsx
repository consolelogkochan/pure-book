import { useState } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';

export const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('hours');
  
  // ▼ 追加・編集用のモーダル開閉State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  const menuItems = [
    { id: 'hours', label: '営業時間・休業日設定' },
    { id: 'period', label: '予約受付期間の設定' },
    { id: 'survey', label: '予約時アンケート設定' },
    { id: 'terms', label: '規約設定' },
    { id: 'menus', label: 'メニュー登録' },
    { id: 'staff', label: 'スタッフ登録' },
    { id: 'resource', label: 'リソース管理（シフト）' },
  ];

  const daysOfWeek = ['月', '火', '水', '木', '金', '土', '日'];

  // ▼ モックデータ
  const mockMenus = [
    { id: 1, name: 'カット', price: '¥5,000', duration: 60 },
    { id: 2, name: 'カット＆カラー', price: '¥12,000', duration: 120 },
    { id: 3, name: 'パーマ', price: '¥15,000', duration: 120 },
  ];

  const mockStaffs = [
    { id: 1, name: '鈴木 一郎', role: '店長' },
    { id: 2, name: '田中 美咲', role: 'スタイリスト' },
    { id: 3, name: '佐藤 花子', role: 'アシスタント' },
  ];

  // 削除ボタンを押した時の推論（確認ポップアップ）
  const handleDelete = (type: string, name: string) => {
    if (window.confirm(`本当に「${name}」を削除しますか？\n※関連付けられている予約がある場合は削除できません。`)) {
      // ▼ type を alert や console.log の中で使う
      console.log(`削除リクエスト - タイプ: ${type}, 対象: ${name}`);
      alert(`「${type}」の削除処理を実行しました（モック）`);
    }
  };

  return (
    <AdminLayout>
       <div className="flex flex-col md:flex-row gap-6 relative">
         
         {/* 左サイドバー */}
         <div className="w-full md:w-64 shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
            <nav className="flex flex-col">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`text-left px-6 py-4 border-b border-slate-100 font-bold transition-colors ${
                    activeTab === item.id ? 'bg-blue-50 text-blue-700 border-l-4 border-l-blue-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
         </div>

         {/* 右メインコンテンツ */}
         <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 min-h-125">
           
           {activeTab === 'hours' && ( 
             <div className="space-y-8 animate-fade-in">
               <h2 className="text-xl font-bold text-slate-800 border-b pb-2">営業時間・休業日設定</h2>
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
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-3">基本営業時間</label>
                 <div className="flex items-center space-x-4">
                   <select className="border border-slate-300 rounded px-4 py-2" defaultValue="09:00"><option>09:00</option></select>
                   <span>〜</span>
                   <select className="border border-slate-300 rounded px-4 py-2" defaultValue="18:00"><option>18:00</option></select>
                 </div>
               </div>
               <button className="bg-slate-800 text-white font-bold py-3 px-8 rounded">設定を保存する</button>
             </div>
           )}

           {activeTab === 'period' && (
             <div className="space-y-6 animate-fade-in">
               <h2 className="text-xl font-bold text-slate-800 border-b pb-2">予約受付期間の設定</h2>
               <div className="flex items-center space-x-2">
                 <input type="number" defaultValue={30} className="border border-slate-300 rounded px-4 py-2 w-24 text-right font-bold" />
                 <span className="font-bold text-slate-700">日後まで</span>
               </div>
               <button className="bg-slate-800 text-white font-bold py-3 px-8 rounded">設定を保存する</button>
             </div>
           )}

           {activeTab === 'survey' && (
             <div className="space-y-6 animate-fade-in">
               <h2 className="text-xl font-bold text-slate-800 border-b pb-2">予約時アンケート設定</h2>
               <input type="text" defaultValue="来店時のご要望などをご記入ください。" className="w-full border rounded px-4 py-2" />
               <button className="bg-slate-800 text-white font-bold py-3 px-8 rounded">設定を保存する</button>
             </div>
           )}

           {activeTab === 'terms' && (
             <div className="space-y-6 animate-fade-in">
               <h2 className="text-xl font-bold text-slate-800 border-b pb-2">規約・キャンセルポリシー設定</h2>
               <textarea className="w-full border rounded px-4 py-3 h-48 resize-y" defaultValue={"1. キャンセルは24時間前まで..."} />
               <button className="bg-slate-800 text-white font-bold py-3 px-8 rounded">規約を保存する</button>
             </div>
           )}

           {/* ==========================================
               Card 13: メニュー登録
               ========================================== */}
           {activeTab === 'menus' && (
             <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center border-b pb-2">
                 <h2 className="text-xl font-bold text-slate-800">メニュー登録</h2>
                 <button 
                   onClick={() => setIsMenuModalOpen(true)}
                   className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition text-sm"
                 >
                   ＋ 新規メニュー追加
                 </button>
               </div>
               
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-50 border-b border-slate-200">
                   <tr>
                     <th className="p-3 font-bold text-sm text-slate-600">メニュー名</th>
                     <th className="p-3 font-bold text-sm text-slate-600">料金</th>
                     <th className="p-3 font-bold text-sm text-slate-600">所要時間</th>
                     <th className="p-3 font-bold text-sm text-slate-600 text-right">操作</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {mockMenus.map(menu => (
                     <tr key={menu.id} className="hover:bg-slate-50">
                       <td className="p-3 font-bold text-slate-800">{menu.name}</td>
                       <td className="p-3 text-slate-600">{menu.price}</td>
                       <td className="p-3 text-slate-600">{menu.duration}分</td>
                       <td className="p-3 text-right space-x-2">
                         <button onClick={() => setIsMenuModalOpen(true)} className="text-sm border border-slate-300 px-3 py-1 rounded hover:bg-slate-100 font-bold">編集</button>
                         <button onClick={() => handleDelete('menu', menu.name)} className="text-sm border border-red-200 text-red-600 px-3 py-1 rounded hover:bg-red-50 font-bold">削除</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}

           {/* ==========================================
               Card 13: スタッフ登録
               ========================================== */}
           {activeTab === 'staff' && (
             <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center border-b pb-2">
                 <h2 className="text-xl font-bold text-slate-800">スタッフ登録</h2>
                 <button 
                   onClick={() => setIsStaffModalOpen(true)}
                   className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition text-sm"
                 >
                   ＋ 新規スタッフ追加
                 </button>
               </div>
               
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-50 border-b border-slate-200">
                   <tr>
                     <th className="p-3 font-bold text-sm text-slate-600">スタッフ名</th>
                     <th className="p-3 font-bold text-sm text-slate-600">役職・ラベル</th>
                     <th className="p-3 font-bold text-sm text-slate-600 text-right">操作</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {mockStaffs.map(staff => (
                     <tr key={staff.id} className="hover:bg-slate-50">
                       <td className="p-3 font-bold text-slate-800">{staff.name}</td>
                       <td className="p-3 text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{staff.role}</span></td>
                       <td className="p-3 text-right space-x-2">
                         <button onClick={() => setIsStaffModalOpen(true)} className="text-sm border border-slate-300 px-3 py-1 rounded hover:bg-slate-100 font-bold">編集</button>
                         <button onClick={() => handleDelete('staff', staff.name)} className="text-sm border border-red-200 text-red-600 px-3 py-1 rounded hover:bg-red-50 font-bold">削除</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}

           {/* ==========================================
               Card 13: リソース管理（シフト設定）
               ========================================== */}
           {activeTab === 'resource' && (
             <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center border-b pb-2">
                 <h2 className="text-xl font-bold text-slate-800">リソース管理（シフト設定）</h2>
                 <span className="text-sm text-slate-500">※カレンダーに表示する出勤状況を設定します</span>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-center border-collapse min-w-150">
                   <thead className="bg-slate-50 border-b border-slate-200">
                     <tr>
                       <th className="p-3 font-bold text-sm text-slate-600 text-left">スタッフ名</th>
                       {['月', '火', '水', '木', '金', '土', '日'].map(day => (
                         <th key={day} className="p-3 font-bold text-sm text-slate-600">{day}</th>
                       ))}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {mockStaffs.map(staff => (
                       <tr key={staff.id} className="hover:bg-slate-50">
                         <td className="p-3 font-bold text-slate-800 text-left">{staff.name}</td>
                         {/* 各日の出退勤プルダウン */}
                         {[1, 2, 3, 4, 5, 6, 7].map(day => (
                           <td key={day} className="p-3">
                             <select className={`border rounded px-2 py-1 text-sm font-bold ${day === 3 && staff.id === 2 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-700'}`}>
                               <option value="work">出勤</option>
                               <option value="off" selected={day === 3 && staff.id === 2}>休み</option>
                             </select>
                           </td>
                         ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               <div className="flex justify-end mt-4">
                 <button className="bg-slate-800 text-white font-bold py-2 px-8 rounded shadow-sm">シフトを保存</button>
               </div>
             </div>
           )}
         </div>
       </div>

       {/* ==========================================
           追加・編集用モーダルウィンドウ
           ========================================== */}
       
       {/* メニュー用モーダル */}
       {isMenuModalOpen && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
             <h3 className="text-xl font-bold text-slate-800 mb-4">メニューの追加・編集</h3>
             <div className="space-y-4">
               <div><label className="block text-sm font-bold mb-1">メニュー名</label><input type="text" className="w-full border rounded px-3 py-2" /></div>
               <div><label className="block text-sm font-bold mb-1">料金 (円)</label><input type="number" className="w-full border rounded px-3 py-2" /></div>
               <div><label className="block text-sm font-bold mb-1">所要時間 (分)</label><input type="number" step="10" className="w-full border rounded px-3 py-2" /></div>
             </div>
             <div className="mt-6 flex justify-end space-x-3">
               <button onClick={() => setIsMenuModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded">キャンセル</button>
               <button onClick={() => setIsMenuModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">保存する</button>
             </div>
           </div>
         </div>
       )}

       {/* スタッフ用モーダル */}
       {isStaffModalOpen && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
             <h3 className="text-xl font-bold text-slate-800 mb-4">スタッフの追加・編集</h3>
             <div className="space-y-4">
               <div><label className="block text-sm font-bold mb-1">スタッフ名</label><input type="text" className="w-full border rounded px-3 py-2" /></div>
               <div><label className="block text-sm font-bold mb-1">役職・ラベル</label><input type="text" placeholder="例: 店長、スタイリスト" className="w-full border rounded px-3 py-2" /></div>
             </div>
             <div className="mt-6 flex justify-end space-x-3">
               <button onClick={() => setIsStaffModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded">キャンセル</button>
               <button onClick={() => setIsStaffModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">保存する</button>
             </div>
           </div>
         </div>
       )}

    </AdminLayout>
  );
};