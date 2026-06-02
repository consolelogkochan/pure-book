import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAdminSearch } from './useAdminSearch';
import type { Booking, Menu } from '../types';

vi.mock('../axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

// downloadBlob は DOM 操作（createObjectURL・click）を含むため全体をモック
vi.mock('../utils/downloadBlob', () => ({
  downloadBlob: vi.fn(),
}));

import axios from '../axios';
import { downloadBlob } from '../utils/downloadBlob';

const axiosError = (status: number, data?: unknown) =>
  Object.assign(new Error(), { isAxiosError: true, response: { status, data } });

const mockMenus: Menu[] = [
  { id: 1, name: 'カット', duration: 60, price: 3000, description: null },
];

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
  survey_responses: { '来店のきっかけ': 'SNS' },
};

// fetchSearchResults が期待するレスポンス形式
const mockSearchResponse = {
  data: [mockBooking],
  current_page: 1,
  last_page: 3,
  total: 25,
};

const setupDefaultMocks = () => {
  vi.mocked(axios.get).mockImplementation((url: string) => {
    if (url === '/menus') return Promise.resolve({ data: { menus: mockMenus } });
    if (url === '/admin/bookings/search') return Promise.resolve({ data: mockSearchResponse });
    return Promise.reject(new Error(`Unexpected GET: ${url}`));
  });
};

// menus が取得されるまで待機（初回 Promise.all の完了を表す最も確実な sentinel）
const renderAndWait = async () => {
  const hook = renderHook(() => useAdminSearch());
  await waitFor(() => expect(hook.result.current.menus.length).toBeGreaterThan(0));
  return hook;
};

describe('useAdminSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  // ─── 初回マウント ─────────────────────────────────────────────────────────────

  describe('初回マウント', () => {
    it('menus と displayResults が並列取得される', async () => {
      const { result } = await renderAndWait();
      expect(result.current.menus).toEqual(mockMenus);
      expect(result.current.displayResults).toHaveLength(1);
      expect(result.current.pagination?.total).toBe(25);
    });

    it('メニュー取得失敗時にエラーメッセージがセットされる', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url === '/menus') return Promise.reject(new Error('Network Error'));
        if (url === '/admin/bookings/search') return Promise.resolve({ data: mockSearchResponse });
        return Promise.reject(new Error(`Unexpected: ${url}`));
      });
      const { result } = renderHook(() => useAdminSearch());
      await waitFor(() => expect(result.current.messageType).toBe('error'));
      expect(result.current.message).toBe(
        'メニューの取得に失敗しました。ページを再読み込みしてください。'
      );
    });

    it('検索取得失敗時にエラーメッセージがセットされる', async () => {
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url === '/menus') return Promise.resolve({ data: { menus: mockMenus } });
        if (url === '/admin/bookings/search') return Promise.reject(new Error('Network Error'));
        return Promise.reject(new Error(`Unexpected: ${url}`));
      });
      const { result } = renderHook(() => useAdminSearch());
      await waitFor(() => expect(result.current.messageType).toBe('error'));
      expect(result.current.message).toBe(
        '検索に失敗しました。通信環境をご確認ください。'
      );
    });
  });

  // ─── displayResults ───────────────────────────────────────────────────────────

  describe('displayResults', () => {
    it('survey_responses が formattedSurveyResponse に変換される', async () => {
      const { result } = await renderAndWait();
      expect(result.current.displayResults[0].formattedSurveyResponse).toBe(
        '来店のきっかけ: SNS'
      );
    });
  });

  // ─── onSubmit ────────────────────────────────────────────────────────────────

  describe('onSubmit', () => {
    it('検索結果と pagination がセットされる', async () => {
      const newBooking = { ...mockBooking, id: 2 };
      const newResponse = { data: [newBooking], current_page: 1, last_page: 1, total: 1 };
      const { result } = await renderAndWait();

      vi.mocked(axios.get).mockResolvedValueOnce({ data: newResponse });
      act(() => {
        result.current.onSubmit({ date: '', name: '太郎', reference: '', menu: '', status: '' });
      });

      await waitFor(() => expect(result.current.pagination?.total).toBe(1));
      expect(result.current.displayResults[0].id).toBe(2);
    });

    it('失敗時にエラーメッセージがセットされる', async () => {
      const { result } = await renderAndWait();

      vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network Error'));
      act(() => {
        result.current.onSubmit({ date: '', name: '', reference: '', menu: '', status: '' });
      });

      await waitFor(() => expect(result.current.messageType).toBe('error'));
      expect(result.current.message).toBe('検索に失敗しました。通信環境をご確認ください。');
    });
  });

  // ─── handleDownloadCsv ───────────────────────────────────────────────────────

  describe('handleDownloadCsv', () => {
    it('成功時に downloadBlob が呼ばれ isDownloading が false に戻る', async () => {
      const { result } = await renderAndWait();
      // renderAndWait 後に設定することで初回フェッチに消費されない
      vi.mocked(axios.get).mockResolvedValueOnce({ data: 'csv,data\n' });

      await act(async () => { await result.current.handleDownloadCsv(); });

      expect(vi.mocked(downloadBlob)).toHaveBeenCalledOnce();
      expect(result.current.isDownloading).toBe(false);
    });

    it('失敗時にエラーメッセージがセットされ isDownloading が false に戻る', async () => {
      const { result } = await renderAndWait();
      vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network Error'));

      await act(async () => { await result.current.handleDownloadCsv(); });

      expect(result.current.message).toBe('CSVのダウンロードに失敗しました。');
      expect(result.current.messageType).toBe('error');
      expect(result.current.isDownloading).toBe(false);
    });
  });

  // ─── handleStatusChange ──────────────────────────────────────────────────────

  describe('handleStatusChange', () => {
    it('成功時に検索が再実行され成功メッセージがセットされる', async () => {
      vi.mocked(axios.patch).mockResolvedValueOnce({});
      const { result } = await renderAndWait();

      // PATCH 後の fetchSearchResults 用
      vi.mocked(axios.get).mockResolvedValueOnce({ data: mockSearchResponse });
      await act(async () => { await result.current.handleStatusChange(1, 'cancelled'); });

      expect(result.current.message).toBe('ステータスを更新しました');
      expect(result.current.messageType).toBe('success');
      expect(result.current.isSaving).toBe(false);
    });

    it('レスポンスにメッセージがある失敗時はそのメッセージを表示する', async () => {
      vi.mocked(axios.patch).mockRejectedValueOnce(
        axiosError(422, { message: 'キャンセル済みの予約は変更できません。' })
      );
      const { result } = await renderAndWait();

      await act(async () => { await result.current.handleStatusChange(1, 'cancelled'); });

      expect(result.current.message).toBe('キャンセル済みの予約は変更できません。');
      expect(result.current.messageType).toBe('error');
    });

    it('その他の失敗時は汎用メッセージがセットされる', async () => {
      vi.mocked(axios.patch).mockRejectedValueOnce(axiosError(500));
      const { result } = await renderAndWait();

      await act(async () => { await result.current.handleStatusChange(1, 'cancelled'); });

      expect(result.current.message).toBe(
        'ステータスの更新に失敗しました。通信環境をご確認ください。'
      );
      expect(result.current.messageType).toBe('error');
    });
  });

  // ─── handlePageChange ────────────────────────────────────────────────────────

  describe('handlePageChange', () => {
    it('指定ページで検索が実行され pagination が更新される', async () => {
      const page2Response = { ...mockSearchResponse, current_page: 2 };
      const { result } = await renderAndWait();

      vi.mocked(axios.get).mockResolvedValueOnce({ data: page2Response });
      act(() => { result.current.handlePageChange(2); });

      await waitFor(() => expect(result.current.pagination?.current_page).toBe(2));
    });
  });
});
