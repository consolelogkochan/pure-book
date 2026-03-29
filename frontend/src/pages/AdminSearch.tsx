import { useForm } from 'react-hook-form';
import { AdminLayout } from '../layouts/AdminLayout';

// 検索フォームの型定義
interface SearchFormInputs {
  date: string;
  name: string;
  reference: string;
  menu: string;
  status: string;
}

export const AdminSearch = () => {
  // react-hook-formを導入！
  const { register, handleSubmit } = useForm<SearchFormInputs>();

  // 検索ボタンが押された時の処理
  const onSubmit = (data: SearchFormInputs) => {
    // 今回はガワの作成なので、コンソールに出力するだけ
    console.log('検索実行（APIへ送信するデータ）:', data);
    alert('検索を実行しました（コンソールを確認してください）');
  };

  // 一覧表示用のモックデータ（指定された全9項目）
  const mockResults = [
    { id: 1, ref: 'BKG-A1B2C', date: '2023-11-20 10:00', name: '山田 太郎', phone: '090-1234-5678', email: 'yamada@example.com', menu: 'カット＆カラー', price: '¥12,000', survey: '静かに過ごしたい', status: 'confirmed' },
    { id: 2, ref: 'BKG-D3E4F', date: '2023-11-21 14:00', name: '佐藤 花子', phone: '080-9876-5432', email: 'sato@example.com', menu: 'パーマ', price: '¥15,000', survey: '髪の痛みが気になる', status: 'confirmed' },
    { id: 3, ref: 'BKG-G5H6I', date: '2023-11-22 11:00', name: '鈴木 一郎', phone: '070-1111-2222', email: 'suzuki@example.com', menu: 'カット', price: '¥5,000', survey: '特になし', status: 'cancelled' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* ==========================================
            上部：検索フィルターUI (react-hook-form使用)
            ========================================== */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">予約検索</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">利用日</label>
              <input type="date" {...register('date')} className="w-full border border-slate-300 rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">お名前</label>
              <input type="text" {...register('name')} placeholder="例: 山田" className="w-full border border-slate-300 rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">予約番号</label>
              <input type="text" {...register('reference')} placeholder="例: BKG-..." className="w-full border border-slate-300 rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">メニュー</label>
              <select {...register('menu')} className="w-full border border-slate-300 rounded px-3 py-2 bg-white">
                <option value="">すべて</option>
                <option value="cut">カット</option>
                <option value="color">カラー</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-slate-800 text-white font-bold py-2 px-4 rounded hover:bg-slate-700 transition">
              検索する
            </button>
          </form>
        </div>

        {/* ==========================================
            下部：検索結果一覧テーブルUI
            ========================================== */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* 伊崎さんの推論！横幅がはみ出た時だけスクロールさせる最強のクラス */}
          <div className="overflow-x-auto">
            {/* whitespace-nowrap で文字の自動改行を防ぎ、表をきれいに保つ */}
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-300">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold text-sm text-slate-600">予約番号</th>
                  <th className="p-4 font-bold text-sm text-slate-600">予約日時</th>
                  <th className="p-4 font-bold text-sm text-slate-600">お名前</th>
                  <th className="p-4 font-bold text-sm text-slate-600">電話番号</th>
                  <th className="p-4 font-bold text-sm text-slate-600">メールアドレス</th>
                  <th className="p-4 font-bold text-sm text-slate-600">メニュー</th>
                  <th className="p-4 font-bold text-sm text-slate-600">料金</th>
                  <th className="p-4 font-bold text-sm text-slate-600">アンケート回答</th>
                  <th className="p-4 font-bold text-sm text-slate-600">ステータス（操作）</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockResults.map((result) => (
                  <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-sm text-slate-600">{result.ref}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">{result.date}</td>
                    <td className="p-4 text-sm text-slate-800">{result.name}</td>
                    <td className="p-4 text-sm text-slate-600">{result.phone}</td>
                    <td className="p-4 text-sm text-slate-600">{result.email}</td>
                    <td className="p-4 text-sm text-slate-800">{result.menu}</td>
                    <td className="p-4 text-sm text-slate-800 font-bold">{result.price}</td>
                    <td className="p-4 text-sm text-slate-500 max-w-xs truncate" title={result.survey}>
                      {result.survey}
                    </td>
                    <td className="p-4">
                      {/* 事実3: 一覧から直接ステータスを変更できるUI */}
                      <select 
                        defaultValue={result.status}
                        className={`text-sm font-bold border rounded px-2 py-1 ${
                          result.status === 'cancelled' ? 'bg-slate-100 text-slate-500 border-slate-300' : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        <option value="confirmed">予約確定</option>
                        <option value="cancelled">キャンセル</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};