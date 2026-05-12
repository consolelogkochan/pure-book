import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { isAxiosError } from 'axios';
import axios from '../axios';
import type { Booking, SearchFormData } from '../types';

interface UseBookingSearchReturn {
  form: UseFormReturn<SearchFormData>;
  searchResult: Booking | null;
  showPayment: boolean;
  isModalOpen: boolean;
  isCancelled: boolean;
  isSearching: boolean;
  errorMessage: string | null;
  onSearch: (data: SearchFormData) => Promise<void>;
  handleCancel: () => Promise<void>;
  handlePaymentSuccess: () => Promise<void>;
  openPaymentForm: () => void;
  closePaymentForm: () => void;
  openCancelModal: () => void;
  closeCancelModal: () => void;
}

export const useBookingSearch = (): UseBookingSearchReturn => {
  const form = useForm<SearchFormData>();
  const [searchResult, setSearchResult] = useState<Booking | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSearch = async (data: SearchFormData): Promise<void> => {
    setIsSearching(true);
    setErrorMessage(null);
    setSearchResult(null);
    setIsCancelled(false);
    setShowPayment(false);

    try {
      const response = await axios.post('/bookings/search', {
        booking_reference: data.booking_reference,
        email: data.email,
      });
      setSearchResult(response.data.booking);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        if (error.response?.status === 429) {
          alert('アクセスが集中しているか、操作が早すぎます。1分ほどお待ちいただいてから再度お試しください。');
          return;
        }
        if (error.response?.status === 404) {
          setErrorMessage('ご指定の予約が見つかりませんでした。入力内容をご確認ください。');
          return;
        }
      }
      setErrorMessage('検索中にエラーが発生しました。');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCancel = async (): Promise<void> => {
    if (!searchResult) return;

    try {
      await axios.delete(`/bookings/${searchResult.booking_reference}`, {
        data: { email: form.getValues('email') },
      });
      setIsModalOpen(false);
      setIsCancelled(true);
    } catch (error: unknown) {
      setIsModalOpen(false);
      if (isAxiosError(error)) {
        if (error.response?.status === 429) {
          alert('アクセスが集中しているか、操作が早すぎます。1分ほどお待ちいただいてから再度お試しください。');
          return;
        }
        if (error.response?.data?.message) {
          alert(error.response.data.message);
          return;
        }
      }
      alert('キャンセルの処理に失敗しました。お手数ですが店舗まで直接ご連絡ください。');
    }
  };

  // Issue 2: awaitして再検索完了を確実に待機する
  const handlePaymentSuccess = async (): Promise<void> => {
    setShowPayment(false);
    await onSearch(form.getValues());
  };

  return {
    form,
    searchResult,
    showPayment,
    isModalOpen,
    isCancelled,
    isSearching,
    errorMessage,
    onSearch,
    handleCancel,
    handlePaymentSuccess,
    // Issue 1: setterの代わりに意図明確なアクション関数を expose
    openPaymentForm: () => setShowPayment(true),
    closePaymentForm: () => setShowPayment(false),
    openCancelModal: () => setIsModalOpen(true),
    closeCancelModal: () => setIsModalOpen(false),
  };
};
