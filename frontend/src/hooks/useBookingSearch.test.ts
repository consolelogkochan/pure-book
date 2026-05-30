import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBookingSearch } from './useBookingSearch';
import type { Booking } from '../types';

vi.mock('../axios', () => ({
  default: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import axios from '../axios';

// isAxiosError は error.isAxiosError === true を検査するため、このヘルパーで再現できる
const axiosError = (status: number, data?: unknown) =>
  Object.assign(new Error(), { isAxiosError: true, response: { status, data } });

const mockBooking: Booking = {
  id: 1,
  booking_reference: 'BKG-TEST1234',
  user_id: null,
  staff_id: 1,
  menu_id: 1,
  customer_name: 'テスト 太郎',
  customer_email: 'test@example.com',
  customer_phone: '090-0000-0000',
  customer_memo: null,
  start_time: '2024-06-01 10:00:00',
  end_time: '2024-06-01 11:00:00',
  status: 'confirmed',
  payment_status: 'unpaid',
  menu: null,
  staff: null,
  survey_responses: null,
};

const searchInput = { booking_reference: 'BKG-TEST1234', email: 'test@example.com' };

describe('useBookingSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── onSearch ────────────────────────────────────────────────────────────────

  describe('onSearch', () => {
    it('検索成功時に searchResult がセットされ errorMessage が null になる', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({ data: { booking: mockBooking } });
      const { result } = renderHook(() => useBookingSearch());

      await act(async () => { await result.current.onSearch(searchInput); });

      expect(result.current.searchResult).toEqual(mockBooking);
      expect(result.current.errorMessage).toBeNull();
    });

    it('検索完了後に isSearching が false に戻る', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({ data: { booking: mockBooking } });
      const { result } = renderHook(() => useBookingSearch());

      await act(async () => { await result.current.onSearch(searchInput); });

      expect(result.current.isSearching).toBe(false);
    });

    it('404 エラー時に予約未発見メッセージがセットされる', async () => {
      vi.mocked(axios.post).mockRejectedValueOnce(axiosError(404));
      const { result } = renderHook(() => useBookingSearch());

      await act(async () => { await result.current.onSearch(searchInput); });

      expect(result.current.errorMessage).toBe(
        'ご指定の予約が見つかりませんでした。入力内容をご確認ください。'
      );
      expect(result.current.searchResult).toBeNull();
    });

    it('429 エラー時にレート制限メッセージがセットされる', async () => {
      vi.mocked(axios.post).mockRejectedValueOnce(axiosError(429));
      const { result } = renderHook(() => useBookingSearch());

      await act(async () => { await result.current.onSearch(searchInput); });

      expect(result.current.errorMessage).toBe(
        'アクセスが集中しているか、操作が早すぎます。1分ほどお待ちいただいてから再度お試しください。'
      );
    });

    it('その他の API エラー時に汎用メッセージがセットされる', async () => {
      vi.mocked(axios.post).mockRejectedValueOnce(axiosError(500));
      const { result } = renderHook(() => useBookingSearch());

      await act(async () => { await result.current.onSearch(searchInput); });

      expect(result.current.errorMessage).toBe('検索中にエラーが発生しました。');
    });

    it('非 Axios エラー時にも汎用メッセージがセットされる', async () => {
      vi.mocked(axios.post).mockRejectedValueOnce(new Error('network error'));
      const { result } = renderHook(() => useBookingSearch());

      await act(async () => { await result.current.onSearch(searchInput); });

      expect(result.current.errorMessage).toBe('検索中にエラーが発生しました。');
    });

    it('isSearching が true のとき二重送信を防ぐ（API は 1 回のみ呼ばれる）', async () => {
      let firstResolve!: (v: unknown) => void;
      vi.mocked(axios.post).mockReturnValueOnce(
        new Promise(r => { firstResolve = r; })
      );
      const { result } = renderHook(() => useBookingSearch());

      act(() => { void result.current.onSearch(searchInput); });
      expect(result.current.isSearching).toBe(true);

      await act(async () => { await result.current.onSearch(searchInput); });
      expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(1);

      await act(async () => { firstResolve({ data: { booking: mockBooking } }); });
    });
  });

  // ─── handleCancel ────────────────────────────────────────────────────────────

  describe('handleCancel', () => {
    it('キャンセル成功時に isCancelled が true になり searchResult が null になる', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({ data: { booking: mockBooking } });
      vi.mocked(axios.delete).mockResolvedValueOnce({});
      const { result } = renderHook(() => useBookingSearch());

      await act(async () => { await result.current.onSearch(searchInput); });
      await act(async () => { await result.current.handleCancel(); });

      expect(result.current.isCancelled).toBe(true);
      expect(result.current.searchResult).toBeNull();
      expect(result.current.isCancelling).toBe(false);
    });

    it('searchResult が null のとき API が呼ばれない', async () => {
      const { result } = renderHook(() => useBookingSearch());

      await act(async () => { await result.current.handleCancel(); });

      expect(vi.mocked(axios.delete)).not.toHaveBeenCalled();
    });

    it('429 エラー時にレート制限メッセージがセットされる', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({ data: { booking: mockBooking } });
      vi.mocked(axios.delete).mockRejectedValueOnce(axiosError(429));
      const { result } = renderHook(() => useBookingSearch());

      await act(async () => { await result.current.onSearch(searchInput); });
      await act(async () => { await result.current.handleCancel(); });

      expect(result.current.errorMessage).toBe(
        'アクセスが集中しているか、操作が早すぎます。1分ほどお待ちいただいてから再度お試しください。'
      );
    });

    it('レスポンスにメッセージがある場合そのメッセージを表示する', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({ data: { booking: mockBooking } });
      vi.mocked(axios.delete).mockRejectedValueOnce(
        axiosError(422, { message: 'キャンセル期限を過ぎています。' })
      );
      const { result } = renderHook(() => useBookingSearch());

      await act(async () => { await result.current.onSearch(searchInput); });
      await act(async () => { await result.current.handleCancel(); });

      expect(result.current.errorMessage).toBe('キャンセル期限を過ぎています。');
    });

    it('その他のエラー時に汎用メッセージがセットされる', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({ data: { booking: mockBooking } });
      vi.mocked(axios.delete).mockRejectedValueOnce(axiosError(500));
      const { result } = renderHook(() => useBookingSearch());

      await act(async () => { await result.current.onSearch(searchInput); });
      await act(async () => { await result.current.handleCancel(); });

      expect(result.current.errorMessage).toBe(
        'キャンセルの処理に失敗しました。お手数ですが店舗まで直接ご連絡ください。'
      );
    });
  });

  // ─── handlePaymentSuccess ────────────────────────────────────────────────────

  describe('handlePaymentSuccess', () => {
    it('showPayment が false になり最新予約情報が再取得される', async () => {
      const paidBooking = { ...mockBooking, payment_status: 'paid' as const };
      vi.mocked(axios.post)
        .mockResolvedValueOnce({ data: { booking: mockBooking } })
        .mockResolvedValueOnce({ data: { booking: paidBooking } });
      const { result } = renderHook(() => useBookingSearch());

      await act(async () => { await result.current.onSearch(searchInput); });
      act(() => { result.current.openPaymentForm(); });
      await act(async () => { await result.current.handlePaymentSuccess(); });

      expect(result.current.showPayment).toBe(false);
      expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(2);
      expect(result.current.searchResult?.payment_status).toBe('paid');
    });
  });

  // ─── UI 状態操作 ─────────────────────────────────────────────────────────────

  describe('UI 状態操作', () => {
    it('openPaymentForm で showPayment が true になる', () => {
      const { result } = renderHook(() => useBookingSearch());
      act(() => { result.current.openPaymentForm(); });
      expect(result.current.showPayment).toBe(true);
    });

    it('closePaymentForm で showPayment が false になる', () => {
      const { result } = renderHook(() => useBookingSearch());
      act(() => { result.current.openPaymentForm(); });
      act(() => { result.current.closePaymentForm(); });
      expect(result.current.showPayment).toBe(false);
    });

    it('openCancelModal で isModalOpen が true になる', () => {
      const { result } = renderHook(() => useBookingSearch());
      act(() => { result.current.openCancelModal(); });
      expect(result.current.isModalOpen).toBe(true);
    });

    it('closeCancelModal で isModalOpen が false になる', () => {
      const { result } = renderHook(() => useBookingSearch());
      act(() => { result.current.openCancelModal(); });
      act(() => { result.current.closeCancelModal(); });
      expect(result.current.isModalOpen).toBe(false);
    });
  });
});
