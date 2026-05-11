import type { BookingStatus, DisplayBooking } from '../../types';

interface Props {
  results: DisplayBooking[];
  isLoading: boolean;
  onStatusChange: (id: number, newStatus: BookingStatus) => void;
}

export const BookingTable = ({ results, isLoading, onStatusChange }: Props) => {
  return (
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
            results.map(result => (
              <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-mono text-sm text-slate-600">{result.booking_reference}</td>
                <td className="p-4 text-sm font-bold text-slate-800">
                  {new Date(result.start_time).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="p-4 text-sm text-slate-800">{result.customer_name}</td>
                <td className="p-4 text-sm text-slate-600">{result.customer_phone}</td>
                <td className="p-4 text-sm text-slate-800">{result.menu?.name}</td>
                <td className="p-4 text-sm text-slate-800">{result.staff?.name || '未定'}</td>
                <td className="p-4 text-sm text-slate-500 max-w-50 truncate" title={result.formattedSurveyResponse}>
                  {result.formattedSurveyResponse !== 'なし'
                    ? result.formattedSurveyResponse
                    : <span className="text-slate-300">-</span>}
                </td>
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
                    onChange={e => onStatusChange(result.id, e.target.value as BookingStatus)}
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
              <td colSpan={9} className="p-8 text-center text-slate-500">
                {isLoading ? '読み込み中...' : '条件に一致する予約が見つかりませんでした。'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
