import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AdminLayout } from '../layouts/AdminLayout';
import axios from 'axios';

interface SearchFormInputs {
  date: string;
  name: string;
  reference: string;
  menu: string;
  status: string;
}

export const AdminSearch = () => {
  const { register, handleSubmit, getValues } = useForm<SearchFormInputs>();
  
  // State管理
  const [results, setResults] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 初回マウント時にメニュー一覧と、初期の予約一覧を取得
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const menusRes = await axios.get('http://localhost/api/menus');
        setMenus(menusRes.data.menus || menusRes.data || []);
        
        // 初期状態（条件なし）で検索を実行しておく
        fetchSearchResults({});
      } catch (error) {
        console.error('初期データの取得に失敗しました', error);
      }
    };
    fetchInitialData();
  }, []);

  // 検索APIを叩いて結果をStateに入れる関数
  const fetchSearchResults = async (params: any) => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost/api/admin/bookings/search', { params });
      setResults(res.data);
    } catch (error) {
      alert('検索に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data: SearchFormInputs) => {
    fetchSearchResults(data);
  };

  // 「CSVダウンロードの魔法」の実装
  const handleDownloadCsv = async () => {
    // 現在の検索条件を取得
    const currentParams = getValues();
    
    try {
      // responseType: 'blob' が超重要！バイナリデータとして受け取るようAxiosに指示
      const response = await axios.get('http://localhost/api/admin/bookings/csv', {
        params: currentParams,
        responseType: 'blob',
      });

      // 1. Blob化（今回はAxiosがやってくれているのでそのまま使う）
      const blob = new Blob([response.data], { type: 'text/csv' });
      // 2. 一時URLの発行
      const url = window.URL.createObjectURL(blob);
      // 3. 見えないリンクを作ってクリック！
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `予約一覧_${new Date().getTime()}.csv`); // ファイル名
      document.body.appendChild(link);
      link.click();
      
      // 終わったらゴミ掃除（メモリ解放）
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      alert('CSVのダウンロードに失敗しました');
    }
  };

  // 一覧画面から直接ステータスを変更する機能
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      // ここは既存の update APIを使い回せますが、簡略化のため status だけ送るパッチ的処理を想定
      // 今回はCard22で作った update メソッドだと他項目も必須になるため、
      // 実際の実装ではステータス変更専用のAPI（PATCH /bookings/{id}/status）を作るのがベストです。
      // 今回はUIの変更確認のみに留めます。
      alert(`※簡易実装: 予約ID [${id}] のステータスを ${newStatus} に変更します。(API連携は省略)`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* --- 検索フィルター --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">予約検索</h2>
            {/* CSVダウンロードボタン */}
            <button 
              type="button" 
              onClick={handleDownloadCsv}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              CSV出力
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
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
            {/* ▼ 変更：メニューを動的に取得したものにする */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">メニュー</label>
              <select {...register('menu')} className="w-full border border-slate-300 rounded px-3 py-2 bg-white">
                <option value="">すべて</option>
                {menus.map(menu => (
                  <option key={menu.id} value={menu.id}>{menu.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">ステータス</label>
              <select {...register('status')} className="w-full border border-slate-300 rounded px-3 py-2 bg-white">
                <option value="">すべて</option>
                <option value="confirmed">予約確定</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-slate-800 text-white font-bold py-2 px-4 rounded hover:bg-slate-700 transition disabled:opacity-50">
              {isLoading ? '検索中...' : '検索する'}
            </button>
          </form>
        </div>

        {/* --- 検索結果一覧 --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-300">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold text-sm text-slate-600">予約番号</th>
                  <th className="p-4 font-bold text-sm text-slate-600">予約日時</th>
                  <th className="p-4 font-bold text-sm text-slate-600">お名前</th>
                  <th className="p-4 font-bold text-sm text-slate-600">電話番号</th>
                  <th className="p-4 font-bold text-sm text-slate-600">メニュー</th>
                  <th className="p-4 font-bold text-sm text-slate-600">担当</th>
                  <th className="p-4 font-bold text-sm text-slate-600">ステータス</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.length > 0 ? (
                  results.map((result) => (
                    <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono text-sm text-slate-600">{result.booking_reference}</td>
                      <td className="p-4 text-sm font-bold text-slate-800">
                        {new Date(result.start_time).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-sm text-slate-800">{result.customer_name}</td>
                      <td className="p-4 text-sm text-slate-600">{result.customer_phone}</td>
                      <td className="p-4 text-sm text-slate-800">{result.menu?.name}</td>
                      <td className="p-4 text-sm text-slate-800">{result.staff?.name || '未定'}</td>
                      <td className="p-4">
                        <select 
                          value={result.status}
                          onChange={(e) => handleStatusChange(result.id, e.target.value)}
                          className={`text-sm font-bold border rounded px-2 py-1 outline-none ${
                            result.status === 'cancelled' ? 'bg-slate-100 text-slate-500 border-slate-300' : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          <option value="confirmed">予約確定</option>
                          <option value="cancelled">キャンセル</option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      {isLoading ? '読み込み中...' : '条件に一致する予約が見つかりませんでした。'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};