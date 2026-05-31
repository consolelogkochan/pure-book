import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBooking } from './useBooking';
import type { Menu, SurveyQuestion } from '../types';

vi.mock('../axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import axiosInstance from '../axios';

const axiosError = (status: number, data?: unknown) =>
  Object.assign(new Error(), { isAxiosError: true, response: { status, data } });

const mockMenus: Menu[] = [
  { id: 1, name: 'カット', duration: 60, price: 3000, description: null },
];
const mockSurveyQuestions: SurveyQuestion[] = [
  { id: 1, question_text: '来店のきっかけ', type: 'text', is_required: false, options: [] },
];
const mockTermsText = '利用規約のテキスト';
const mockSlots = ['10:00', '11:00', '13:00'];
const mockDate = new Date(2024, 5, 1); // 2024-06-01

// URL ごとに返り値を振り分けるデフォルトモック
const setupDefaultMocks = () => {
  vi.mocked(axiosInstance.get).mockImplementation((url: string) => {
    if (url === '/menus') return Promise.resolve({ data: { menus: mockMenus } });
    if (url === '/survey-questions') return Promise.resolve({ data: mockSurveyQuestions });
    if (url === '/settings') return Promise.resolve({ data: { terms_text: mockTermsText } });
    if (url === '/available-slots') return Promise.resolve({ data: { available_slots: mockSlots } });
    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
};

// 初回フェッチ（Promise.all）完了まで待機するヘルパー
const renderAndWait = async () => {
  const hook = renderHook(() => useBooking());
  await waitFor(() => expect(hook.result.current.menus.length).toBeGreaterThan(0));
  return hook;
};

// onSubmit 可能な状態（メニュー・日付・時間すべてセット済み）にするヘルパー
const setupBookingFlow = async (result: { current: ReturnType<typeof useBooking> }) => {
  act(() => { result.current.handleMenuSelect(mockMenus[0]); });
  await act(async () => { await result.current.handleDateChange(mockDate); });
  act(() => { result.current.handleTimeSelect('10:00'); });
};

const formData = {
  customer_name: 'テスト 太郎',
  customer_email: 'test@example.com',
  customer_phone: '090-0000-0000',
  terms_accepted: true,
};

describe('useBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  // ─── 初回マウント ─────────────────────────────────────────────────────────────

  describe('初回マウント', () => {
    it('menus・surveyQuestions・termsText が並列取得される', async () => {
      const { result } = await renderAndWait();
      expect(result.current.menus).toEqual(mockMenus);
      expect(result.current.surveyQuestions).toEqual(mockSurveyQuestions);
      expect(result.current.termsText).toBe(mockTermsText);
    });

    it('フェッチ失敗時にエラーメッセージがセットされる', async () => {
      vi.mocked(axiosInstance.get).mockRejectedValue(new Error('Network Error'));
      const { result } = renderHook(() => useBooking());
      await waitFor(() => expect(result.current.errorMessage).not.toBeNull());
      expect(result.current.errorMessage).toBe(
        'データの取得に失敗しました。ページを再読み込みしてください。'
      );
    });
  });

  // ─── handleMenuSelect ────────────────────────────────────────────────────────

  describe('handleMenuSelect', () => {
    it('selectedMenu がセットされる', async () => {
      const { result } = await renderAndWait();
      act(() => { result.current.handleMenuSelect(mockMenus[0]); });
      expect(result.current.selectedMenu).toEqual(mockMenus[0]);
    });

    it('errorMessage がクリアされる', async () => {
      const { result } = await renderAndWait();
      // メニュー未選択で日付変更してエラーを発生させる
      await act(async () => { await result.current.handleDateChange(mockDate); });
      expect(result.current.errorMessage).not.toBeNull();
      act(() => { result.current.handleMenuSelect(mockMenus[0]); });
      expect(result.current.errorMessage).toBeNull();
    });
  });

  // ─── handleDateChange ────────────────────────────────────────────────────────

  describe('handleDateChange', () => {
    it('メニュー未選択のとき「先にメニューを選択」エラーがセットされる', async () => {
      const { result } = await renderAndWait();
      await act(async () => { await result.current.handleDateChange(mockDate); });
      expect(result.current.errorMessage).toBe('先にメニューを選択してください。');
    });

    it('メニュー選択済みのとき availableSlots がセットされる', async () => {
      const { result } = await renderAndWait();
      act(() => { result.current.handleMenuSelect(mockMenus[0]); });
      await act(async () => { await result.current.handleDateChange(mockDate); });
      expect(result.current.availableSlots).toEqual(mockSlots);
      expect(result.current.selectedDate).toEqual(mockDate);
    });

    it('日付変更のたびに selectedTime が null にリセットされる', async () => {
      const { result } = await renderAndWait();
      act(() => { result.current.handleMenuSelect(mockMenus[0]); });
      await act(async () => { await result.current.handleDateChange(mockDate); });
      act(() => { result.current.handleTimeSelect('10:00'); });
      await act(async () => { await result.current.handleDateChange(new Date(2024, 5, 2)); });
      expect(result.current.selectedTime).toBeNull();
    });

    it('スロット取得失敗時にエラーメッセージがセットされる', async () => {
      vi.mocked(axiosInstance.get).mockImplementation((url: string) => {
        if (url === '/menus') return Promise.resolve({ data: { menus: mockMenus } });
        if (url === '/survey-questions') return Promise.resolve({ data: mockSurveyQuestions });
        if (url === '/settings') return Promise.resolve({ data: { terms_text: mockTermsText } });
        return Promise.reject(new Error('Network Error'));
      });
      const { result } = await renderAndWait();
      act(() => { result.current.handleMenuSelect(mockMenus[0]); });
      await act(async () => { await result.current.handleDateChange(mockDate); });
      expect(result.current.errorMessage).toBe(
        '空き時間の取得に失敗しました。日付を選び直してください。'
      );
    });
  });

  // ─── handleTimeSelect ────────────────────────────────────────────────────────

  describe('handleTimeSelect', () => {
    it('selectedTime がセットされる', async () => {
      const { result } = await renderAndWait();
      act(() => { result.current.handleTimeSelect('10:00'); });
      expect(result.current.selectedTime).toBe('10:00');
    });
  });

  // ─── onSubmit ────────────────────────────────────────────────────────────────

  describe('onSubmit', () => {
    it('menu・date・time のいずれかが未設定のとき API が呼ばれない', async () => {
      const { result } = await renderAndWait();
      await act(async () => { await result.current.onSubmit(formData); });
      expect(vi.mocked(axiosInstance.post)).not.toHaveBeenCalled();
    });

    it('予約成功時に completedBookingRef がセットされる', async () => {
      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: { booking: { booking_reference: 'BKG-TEST1234' } },
      });
      const { result } = await renderAndWait();
      await setupBookingFlow(result);
      await act(async () => { await result.current.onSubmit(formData); });
      expect(result.current.completedBookingRef).toBe('BKG-TEST1234');
      expect(result.current.isSubmitting).toBe(false);
    });

    it('429 エラー時にレート制限メッセージがセットされる', async () => {
      vi.mocked(axiosInstance.post).mockRejectedValueOnce(axiosError(429));
      const { result } = await renderAndWait();
      await setupBookingFlow(result);
      await act(async () => { await result.current.onSubmit(formData); });
      expect(result.current.errorMessage).toBe(
        'アクセスが集中しているか、操作が早すぎます。1分ほどお待ちいただいてから再度お試しください。'
      );
    });

    it('409 エラー時に競合メッセージがセットされ availableSlots が再取得される', async () => {
      const refreshedSlots = ['14:00', '15:00'];
      vi.mocked(axiosInstance.post).mockRejectedValueOnce(axiosError(409));
      const { result } = await renderAndWait();
      await setupBookingFlow(result);
      // setupBookingFlow 後の次の GET /available-slots（= 409 後の refreshAvailableSlots）に使われる
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({
        data: { available_slots: refreshedSlots },
      });
      await act(async () => { await result.current.onSubmit(formData); });
      expect(result.current.errorMessage).toBe(
        '申し訳ありません！タッチの差でこの時間は埋まってしまいました。別の時間をお選びください。'
      );
      expect(result.current.availableSlots).toEqual(refreshedSlots);
    });

    it('409 後のスロット再取得が成功しても 409 エラーメッセージが上書きされない', async () => {
      vi.mocked(axiosInstance.post).mockRejectedValueOnce(axiosError(409));
      const { result } = await renderAndWait();
      await setupBookingFlow(result);
      // 再取得は成功（defaultMock が適用される）→ setErrorMessage は呼ばれない
      await act(async () => { await result.current.onSubmit(formData); });
      expect(result.current.errorMessage).toBe(
        '申し訳ありません！タッチの差でこの時間は埋まってしまいました。別の時間をお選びください。'
      );
    });

    it('その他のエラー時に汎用メッセージがセットされる', async () => {
      vi.mocked(axiosInstance.post).mockRejectedValueOnce(axiosError(500));
      const { result } = await renderAndWait();
      await setupBookingFlow(result);
      await act(async () => { await result.current.onSubmit(formData); });
      expect(result.current.errorMessage).toBe(
        '予約の保存に失敗しました。入力内容をご確認ください。'
      );
    });

    it('送信完了後に isSubmitting が false に戻る', async () => {
      vi.mocked(axiosInstance.post).mockRejectedValueOnce(axiosError(500));
      const { result } = await renderAndWait();
      await setupBookingFlow(result);
      await act(async () => { await result.current.onSubmit(formData); });
      expect(result.current.isSubmitting).toBe(false);
    });
  });
});
