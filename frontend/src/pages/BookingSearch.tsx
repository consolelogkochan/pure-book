import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from '../axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { BookingStatus, PaymentStatus } from '../types';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY);

interface SearchFormData {
  booking_reference: string;
  email: string;
}

interface Booking {
  booking_reference: string;
  customer_name: string;
  start_time: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  menu: { name: string; price: number };
}

// ==========================================
// 💳 決済フォームコンポーネント（内部コンポーネントとして分離）
// ==========================================
const CheckoutForm = ({ booking, onSuccess, onCancel }: { booking: Booking, onSuccess: () => void, onCancel: () => void }) => {
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
      // 1. Laravelから決済の準備情報（clientSecret）をもらう
      const intentRes = await axios.post(`/bookings/${booking.booking_reference}/payment-intent`);
      const clientSecret = intentRes.data.clientSecret;

      const cardElement = elements.getElement('card');

      // ▼ 追加：cardElement が null の場合の安全確認（これでTSの警告が完全に消えます）
      if (!cardElement) {
        throw new Error('クレジットカード情報が正しく読み込まれませんでした。');
      }

      // 2. Stripeに直接カード情報を送って決済を実行する
      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: booking.customer_name }, // 不正利用防止のための名前情報
        },
      });

      if (paymentResult.error) {
        // カード情報の間違いや残高不足の場合
        throw new Error(paymentResult.error.message || '決済に失敗しました。');
      }

      if (paymentResult.paymentIntent?.status === 'succeeded') {
        // 3. Laravelに「決済成功したから確認してDBを更新して！」と伝える
        await axios.post(`/bookings/${booking.booking_reference}/verify-payment`, {
          payment_intent_id: paymentResult.paymentIntent.id,
        });
        
        alert('決済が完了しました！');
        onSuccess(); // 親コンポーネントに成功を通知して再読み込みさせる
      }

    } catch (error: any) {
      setErrorMessage(error.message || '予期せぬエラーが発生しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-white border rounded-lg shadow-inner">
      <h4 className="font-bold text-gray-700 mb-4">クレジットカード決済 ({booking.menu.price.toLocaleString()}円)</h4>
      
      {/* Stripeが提供する安全なカード入力枠 */}
      <div className="p-3 border rounded-md bg-gray-50 mb-4">
        <CardElement options={{ hidePostalCode: true }} />
      </div>

      {errorMessage && <p className="text-red-500 text-sm mb-4">{errorMessage}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} disabled={isProcessing} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded font-bold hover:bg-gray-300 transition">
          キャンセル
        </button>
        <button type="submit" disabled={!stripe || isProcessing} className={`flex-1 py-2 text-white rounded font-bold transition ${isProcessing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {isProcessing ? '処理中...' : '決済を確定する'}
        </button>
      </div>
    </form>
  );
};

// ==========================================
// 🔍 メイン：予約検索画面コンポーネント
// ==========================================

export const BookingSearch = () => {
  // 「画面の4つの状態」を管理するState
  const [searchResult, setSearchResult] = useState<Booking | null>(null); // 検索結果
  const [isModalOpen, setIsModalOpen] = useState(false); // キャンセル確認モーダルの開閉
  const [isCancelled, setIsCancelled] = useState(false); // キャンセル完了状態
  const [isSearching, setIsSearching] = useState(false); // 検索中（ローディング）
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // エラー表示用
  const [showPayment, setShowPayment] = useState(false); // 決済フォームの表示切替

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<SearchFormData>();

  // 1. 検索処理（APIへGET送信）
  const onSearch = async (data: SearchFormData) => {
    setIsSearching(true);
    setErrorMessage(null);
    setSearchResult(null);
    setIsCancelled(false);
    setShowPayment(false);

    try {
      // GETではなくPOSTに変更し、データを直接Bodyに入れて送る
      const response = await axios.post('/bookings/search', {
        booking_reference: data.booking_reference,
        email: data.email
      });
      setSearchResult(response.data.booking);
    } catch (error: any) {
      // 429エラー（レートリミット）のハンドリング
      if (error.response && error.response.status === 429) {
        alert('アクセスが集中しているか、操作が早すぎます。1分ほどお待ちいただいてから再度お試しください。');
        return;
      }

      if (error.response && error.response.status === 404) {
        setErrorMessage('ご指定の予約が見つかりませんでした。入力内容をご確認ください。');
      } else {
        setErrorMessage('検索中にエラーが発生しました。');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // 2. キャンセル実行処理（APIへPOST/PATCH送信）
  const handleCancel = async () => {
    if (!searchResult) return;

    try {
      // 予約番号とメールアドレスを再度送って本人確認しながらキャンセル
      // ※AxiosのDELETEでBody（データ）を送る場合は、{ data: {...} } という書き方をします
      await axios.delete(`/bookings/${searchResult.booking_reference}`, {
        data: { email: getValues('email') }
      });
      
      setIsModalOpen(false); // モーダルを閉じる
      setIsCancelled(true); // キャンセル完了画面に切り替える
    } catch (error: any) {
      setIsModalOpen(false); // エラー時もまずはモーダルを閉じる

      // 429エラー（レートリミット）のハンドリング
      if (error.response && error.response.status === 429) {
        alert('アクセスが集中しているか、操作が早すぎます。1分ほどお待ちいただいてから再度お試しください。');
        return;
      }

      // Laravelから具体的なエラーメッセージ（403, 404, 400など）が返ってきているかチェック
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message); // 「キャンセル期限を過ぎているため...」を表示
      } else {
        // サーバーが落ちているなど、予期せぬ通信エラーの場合
        alert('キャンセルの処理に失敗しました。お手数ですが店舗まで直接ご連絡ください。');
      }
    }
  };

  // 決済成功時に検索結果を再取得する
  const handlePaymentSuccess = () => {
    setShowPayment(false);
    onSearch(getValues());
  };

  // ==========================================
  // 画面の切り替え（UI描画）
  // ==========================================

  // 状態4：キャンセル完了画面
  if (isCancelled) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow-sm mt-8 text-center">
        <div className="text-gray-400 text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">ご予約のキャンセルを承りました。</h2>
        <p className="mb-6 text-gray-600">またのご利用を心よりお待ちしております。</p>
        <button 
          onClick={() => window.location.reload()} 
          className="text-blue-600 hover:underline"
        >
          トップページへ戻る
        </button>
      </div>
    );
  }

  // 検索フォームと検索結果画面
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-sm mt-8 relative">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">予約の確認・キャンセル</h2>

      {/* 検索フォーム */}
      <form onSubmit={handleSubmit(onSearch)} className="space-y-4 mb-8 bg-gray-50 p-6 rounded-lg border">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">予約照会番号</label>
          <input 
            {...register('booking_reference', { required: '予約番号を入力してください' })}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            placeholder="例: BKG-XXXXX"
          />
          {errors.booking_reference && <p className="text-red-500 text-xs mt-1">{errors.booking_reference.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">ご登録メールアドレス</label>
          <input 
            {...register('email', { required: 'メールアドレスを入力してください' })}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            placeholder="例: taro@example.com"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <button 
          type="submit" 
          disabled={isSearching}
          className={`w-full py-2 rounded font-bold text-white transition ${
            isSearching ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSearching ? '検索中...' : '予約を検索する'}
        </button>
      </form>

      {/* エラーメッセージ */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
          {errorMessage}
        </div>
      )}

      {/* 検索結果の表示 */}
      {searchResult && (
        <div className="border border-green-200 bg-green-50 p-6 rounded-lg animate-fade-in-up">
          <h3 className="text-lg font-bold mb-4 text-green-800">ご予約が見つかりました</h3>
          <div className="space-y-2 mb-6 text-gray-700">
            <p><span className="font-bold">お名前：</span>{searchResult.customer_name} 様</p>
            <p><span className="font-bold">ご予約日時：</span>{new Date(searchResult.start_time).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p>
              <span className="font-bold">現在のステータス：</span>
              {searchResult.status === 'confirmed' ? (
                <span className="text-blue-600 font-bold">予約確定</span>
              ) : searchResult.status === 'cancelled' ? (
                <span className="text-red-600 font-bold">キャンセル済み</span>
              ) : searchResult.status}
            </p>

            {/* ▼ 支払いステータスの表示 ▼ */}
            <p>
              <span className="font-bold">お支払い：</span>
              {searchResult.payment_status === 'paid' ? (
                <span className="text-green-600 font-bold">事前決済済み</span>
              ) : searchResult.payment_status === 'refunded' ? (
                <span className="text-gray-500">返金済み</span>
              ) : (
                <span className="text-orange-500 font-bold">当日店舗支払い（未決済）</span>
              )}
            </p>
          </div>

          {/* ▼ 決済ボタン＆決済フォームの展開 ▼ */}
          {searchResult.status !== 'cancelled' && searchResult.payment_status === 'unpaid' && (
            <div className="mb-4">
              {!showPayment ? (
                <button onClick={() => setShowPayment(true)} className="w-full py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 transition shadow-sm">
                  💳 オンラインで事前決済する
                </button>
              ) : (
                // StripeのElementsプロバイダーで決済フォームを包む
                <Elements stripe={stripePromise}>
                  <CheckoutForm 
                    booking={searchResult} 
                    onSuccess={handlePaymentSuccess} 
                    onCancel={() => setShowPayment(false)} 
                  />
                </Elements>
              )}
            </div>
          )}

          {/* キャンセルボタン（決済中は隠す） */}
          {searchResult.status !== 'cancelled' && !showPayment && (
            <button onClick={() => setIsModalOpen(true)} className="w-full py-2 border border-red-500 text-red-500 rounded font-bold hover:bg-red-50 transition mt-2">
              この予約をキャンセルする
            </button>
          )}
        </div>
      )}

      {/* キャンセル確認モーダル（isModalOpenがtrueの時だけ画面の上に重なって表示） */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-all flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-red-600 mb-2">本当によろしいですか？</h3>
            <p className="text-gray-600 mb-6 text-sm">
              一度キャンセルすると元に戻すことはできません。この予約を取り消しますか？
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsModalOpen(false)} // モーダルを閉じる
                className="flex-1 py-2 bg-gray-200 text-gray-800 rounded font-bold hover:bg-gray-300 transition"
              >
                やめる
              </button>
              <button 
                onClick={handleCancel} // 実際のキャンセルAPIを叩く
                className="flex-1 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition"
              >
                キャンセル確定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};