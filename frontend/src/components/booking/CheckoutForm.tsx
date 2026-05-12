import { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from '../../axios';
import type { Booking } from '../../types';
import { stripePromise } from '../../lib/stripe';

interface Props {
  booking: Booking;
  onSuccess: () => void;
  onCancel: () => void;
}

const CheckoutFormInner = ({ booking, onSuccess, onCancel }: Props) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const intentRes = await axios.post(`/bookings/${booking.booking_reference}/payment-intent`);
      const clientSecret = intentRes.data.clientSecret;

      const cardElement = elements.getElement('card');
      if (!cardElement) {
        throw new Error('クレジットカード情報が正しく読み込まれませんでした。');
      }

      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: booking.customer_name },
        },
      });

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message || '決済に失敗しました。');
      }

      if (paymentResult.paymentIntent?.status === 'succeeded') {
        await axios.post(`/bookings/${booking.booking_reference}/verify-payment`, {
          payment_intent_id: paymentResult.paymentIntent.id,
        });
        alert('決済が完了しました！');
        onSuccess();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-white border rounded-lg shadow-inner">
      <h4 className="font-bold text-gray-700 mb-4">
        クレジットカード決済 ({booking.menu?.price.toLocaleString() ?? '0'}円)
      </h4>

      <div className="p-3 border rounded-md bg-gray-50 mb-4">
        <CardElement options={{ hidePostalCode: true }} />
      </div>

      {errorMessage && <p className="text-red-500 text-sm mb-4">{errorMessage}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 py-2 bg-gray-200 text-gray-700 rounded font-bold hover:bg-gray-300 transition"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className={`flex-1 py-2 text-white rounded font-bold transition ${isProcessing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isProcessing ? '処理中...' : '決済を確定する'}
        </button>
      </div>
    </form>
  );
};

export const CheckoutForm = (props: Props) => (
  <Elements stripe={stripePromise}>
    <CheckoutFormInner {...props} />
  </Elements>
);
