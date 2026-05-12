import type { Booking } from '../../types';
import { CheckoutForm } from './CheckoutForm';

interface Props {
  booking: Booking;
  showPayment: boolean;
  onShowPayment: () => void;
  onHidePayment: () => void;
  onPaymentSuccess: () => Promise<void>;
  onCancelRequest: () => void;
}

export const BookingResultCard = ({
  booking,
  showPayment,
  onShowPayment,
  onHidePayment,
  onPaymentSuccess,
  onCancelRequest,
}: Props) => {
  return (
    <div className="border border-green-200 bg-green-50 p-6 rounded-lg animate-fade-in-up">
      <h3 className="text-lg font-bold mb-4 text-green-800">ご予約が見つかりました</h3>

      <div className="space-y-2 mb-6 text-gray-700">
        <p><span className="font-bold">お名前：</span>{booking.customer_name} 様</p>
        <p>
          <span className="font-bold">ご予約日時：</span>
          {new Date(booking.start_time).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        <p>
          <span className="font-bold">現在のステータス：</span>
          {booking.status === 'confirmed' ? (
            <span className="text-blue-600 font-bold">予約確定</span>
          ) : booking.status === 'cancelled' ? (
            <span className="text-red-600 font-bold">キャンセル済み</span>
          ) : booking.status}
        </p>
        <p>
          <span className="font-bold">お支払い：</span>
          {booking.payment_status === 'paid' ? (
            <span className="text-green-600 font-bold">事前決済済み</span>
          ) : booking.payment_status === 'refunded' ? (
            <span className="text-gray-500">返金済み</span>
          ) : (
            <span className="text-orange-500 font-bold">当日店舗支払い（未決済）</span>
          )}
        </p>
      </div>

      {booking.status !== 'cancelled' && booking.payment_status === 'unpaid' && (
        <div className="mb-4">
          {!showPayment ? (
            <button
              onClick={onShowPayment}
              className="w-full py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 transition shadow-sm"
            >
              💳 オンラインで事前決済する
            </button>
          ) : (
            <CheckoutForm
              booking={booking}
              onSuccess={onPaymentSuccess}
              onCancel={onHidePayment}
            />
          )}
        </div>
      )}

      {booking.status !== 'cancelled' && !showPayment && (
        <button
          onClick={onCancelRequest}
          className="w-full py-2 border border-red-500 text-red-500 rounded font-bold hover:bg-red-50 transition mt-2"
        >
          この予約をキャンセルする
        </button>
      )}
    </div>
  );
};
