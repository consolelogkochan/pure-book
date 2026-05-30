import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStaffSettings } from './useStaffSettings';
import type { Staff } from '../types';

vi.mock('../axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import axios from '../axios';

const mockStaffs: Staff[] = [
  { id: 1, name: '田中 花子', role: null, is_active: true },
  { id: 2, name: '鈴木 次郎', role: null, is_active: false },
];

// 初回マウントの useEffect が完了するまで待機するヘルパー
const renderAndWait = async () => {
  const hook = renderHook(() => useStaffSettings());
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  return hook;
};

describe('useStaffSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 全テストで初回フェッチが成功するデフォルトを設定
    vi.mocked(axios.get).mockResolvedValue({ data: mockStaffs });
  });

  // ─── 初回マウント ─────────────────────────────────────────────────────────────

  describe('初回マウント', () => {
    it('フェッチ成功時に staffs がセットされ isLoading が false になる', async () => {
      const { result } = await renderAndWait();

      expect(result.current.staffs).toEqual(mockStaffs);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchFailed).toBe(false);
    });

    it('フェッチ失敗時に fetchFailed が true になりエラーメッセージがセットされる', async () => {
      vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network Error'));
      const { result } = renderHook(() => useStaffSettings());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.fetchFailed).toBe(true);
      expect(result.current.messageType).toBe('error');
      expect(result.current.message).toBe(
        'データの取得に失敗しました。ページを再読み込みしてください。'
      );
    });
  });

  // ─── openModal / closeModal ───────────────────────────────────────────────────

  describe('openModal / closeModal', () => {
    it('staff を渡して openModal すると editingStaff がセットされ isModalOpen が true になる', async () => {
      const { result } = await renderAndWait();

      act(() => { result.current.openModal(mockStaffs[0]); });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.editingStaff).toEqual(mockStaffs[0]);
    });

    it('staff なしで openModal すると editingStaff が null になる', async () => {
      const { result } = await renderAndWait();

      act(() => { result.current.openModal(); });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.editingStaff).toBeNull();
    });

    it('closeModal で isModalOpen が false になり editingStaff が null になる', async () => {
      const { result } = await renderAndWait();

      act(() => { result.current.openModal(mockStaffs[0]); });
      act(() => { result.current.closeModal(); });

      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.editingStaff).toBeNull();
    });
  });

  // ─── requestToggle / cancelToggle ────────────────────────────────────────────

  describe('requestToggle / cancelToggle', () => {
    it('requestToggle で confirmingStaff がセットされる', async () => {
      const { result } = await renderAndWait();

      act(() => { result.current.requestToggle(mockStaffs[0]); });

      expect(result.current.confirmingStaff).toEqual(mockStaffs[0]);
    });

    it('cancelToggle で confirmingStaff が null になる', async () => {
      const { result } = await renderAndWait();

      act(() => { result.current.requestToggle(mockStaffs[0]); });
      act(() => { result.current.cancelToggle(); });

      expect(result.current.confirmingStaff).toBeNull();
    });
  });

  // ─── confirmToggle ────────────────────────────────────────────────────────────

  describe('confirmToggle', () => {
    it('confirmingStaff が null のとき API が呼ばれない', async () => {
      const { result } = await renderAndWait();

      await act(async () => { await result.current.confirmToggle(); });

      expect(vi.mocked(axios.patch)).not.toHaveBeenCalled();
    });

    it('成功時にスタッフ一覧が再取得され成功メッセージがセットされる', async () => {
      vi.mocked(axios.patch).mockResolvedValueOnce({});
      const { result } = await renderAndWait();

      act(() => { result.current.requestToggle(mockStaffs[0]); });
      await act(async () => { await result.current.confirmToggle(); });

      expect(vi.mocked(axios.patch)).toHaveBeenCalledTimes(1);
      // 初回マウント + confirmToggle 後の再フェッチ
      expect(vi.mocked(axios.get)).toHaveBeenCalledTimes(2);
      expect(result.current.message).toBe(`「${mockStaffs[0].name}」のステータスを変更しました`);
      expect(result.current.messageType).toBe('success');
      expect(result.current.isSaving).toBe(false);
    });

    it('PATCH 失敗時にエラーメッセージがセットされ isSaving が false に戻る', async () => {
      vi.mocked(axios.patch).mockRejectedValueOnce(new Error('Server Error'));
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = await renderAndWait();

      act(() => { result.current.requestToggle(mockStaffs[0]); });
      await act(async () => { await result.current.confirmToggle(); });

      expect(result.current.message).toBe(
        'ステータスの変更に失敗しました。通信環境をご確認ください。'
      );
      expect(result.current.messageType).toBe('error');
      expect(result.current.isSaving).toBe(false);
    });

    it('成功後は confirmingStaff が null になる', async () => {
      vi.mocked(axios.patch).mockResolvedValueOnce({});
      const { result } = await renderAndWait();

      act(() => { result.current.requestToggle(mockStaffs[0]); });
      await act(async () => { await result.current.confirmToggle(); });

      expect(result.current.confirmingStaff).toBeNull();
    });
  });
});
