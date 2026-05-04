import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AdminLayout } from '../layouts/AdminLayout';
import { Button } from '../components/Button';
import axios from '../axios';
import type { Booking, BookingStatus, Menu } from '../types';

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
  const [results, setResults] = useState<Booking[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<{current_page: number, last_page: number, total: number} | null>(null);

  // 初回マウント時にメニュー一覧と、初期の予約一覧を取得
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const menusRes = await axios.get('/menus');
        setMenus(menusRes.data.menus || menusRes.data || []);
        
        // 初期状態（条件なし）で検索を実行しておく
        fetchSearchResults({}, 1); 
      } catch (error) {
        console.error('初期データの取得に失敗しました', error);
      }
    };
    fetchInitialData();
  }, []);

  // 検索APIを叩いて結果をStateに入れる関数
  const fetchSearchResults = async (params: Partial<SearchFormInputs>, page: number = 1) => {
    setIsLoading(true);
    try {
      const res = await axios.get('/admin/bookings/search', { 
        params: { ...params, page } 
      });
      // Laravelの paginate() を使うと、データ本体は .data の中に入る
      setResults(res.data.data);
      setPagination({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total
      });
    } catch (error) {
      alert('検索に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data: SearchFormInputs) => {
    fetchSearchResults(data, 1); 
  };

  // 「CSVダウンロードの魔法」の実装
  const handleDownloadCsv = async () => {
    // 現在の検索条件を取得
    const currentParams = getValues();
    
    try {
      // responseType: 'blob' が超重要！バイナリデータとして受け取るようAxiosに指示
      const response = await axios.get('/admin/bookings/csv', {
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
  const handleStatusChange = async (id: number, newStatus: BookingStatus) => {
    try {
      await axios.patch(`/admin/bookings/${id}/status`, { status: newStatus });
      alert('ステータスを更新しました');
      
      // 再検索せず、画面上のデータだけを書き換えて通信を節約する
      setResults(prevResults => 
        prevResults.map(r => r.id === id ? { ...r, status: newStatus } : r)
      );
    } catch (error: any) {
      // Laravelからの具体的なエラーメッセージがあればそれを表示する
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert('ステータスの更新に失敗しました');
      }
    }
  };

  // アンケートデータを画面表示用の文字列に変換する関数
  const formatSurveyResponse = (responses: Record<string, unknown> | null) => {
    if (!responses || typeof responses !== 'object') return 'なし';
    
    return Object.entries(responses).map(([question, answer]) => {
      // JavaScriptでも、配列ならカンマ区切り、それ以外は文字に変換する処理を挟む
      const answerText = Array.isArray(answer) ? answer.join(', ') : String(answer);
      return `${question}: ${answerText}`;
    }).join(' / ');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* --- 検索フィルター --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">予約検索</h2>
            {/* CSVダウンロードボタン */}
            <Button onClick={handleDownloadCsv} colorClass="bg-green-600 hover:bg-green-700 flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              CSV出力
            </Button>
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
            <Button type="submit" disabled={isLoading} colorClass="bg-slate-800 hover:bg-slate-700 w-full">
              {isLoading ? '検索中...' : '検索する'}
            </Button>
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
                  <th className="p-4 font-bold text-sm text-slate-600">アンケート回答</th>
                  <th className="p-4 font-bold text-sm text-slate-600">決済</th>
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
                      <td className="p-4 text-sm text-slate-500 max-w-50 truncate" title={formatSurveyResponse(result.survey_responses)}>
                        {formatSurveyResponse(result.survey_responses) !== 'なし' 
                          ? formatSurveyResponse(result.survey_responses) 
                          : <span className="text-slate-300">-</span>}
                      </td>
                      {/* 決済ステータスバッジ */}
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                          result.payment_status === 'paid' ? 'bg-indigo-100 text-indigo-700' : 
                          result.payment_status === 'refunded' ? 'bg-red-100 text-red-700' : 
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {result.payment_status === 'paid' ? '事前決済済' : 
                           result.payment_status === 'refunded' ? '返金済' : '未決済'}
                        </span>
                      </td>
                      <td className="p-4">
                        <select 
                          value={result.status}
                          onChange={(e) => handleStatusChange(result.id, e.target.value as BookingStatus)}
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

          {/* ページネーション（全件数とページ送りボタン） */}
          {pagination && pagination.last_page > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="text-sm text-slate-600 font-bold">
                全 {pagination.total} 件中 {pagination.current_page} ページ目
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => fetchSearchResults(getValues(), pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  colorClass="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  前へ
                </Button>
                <Button 
                  onClick={() => fetchSearchResults(getValues(), pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  colorClass="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  次へ
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};