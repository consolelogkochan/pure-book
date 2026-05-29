import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CancelModal } from './CancelModal';

const defaultProps = {
  onConfirm: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  onClose: vi.fn(),
};

describe('CancelModal', () => {
  describe('表示', () => {
    it('確認テキストが表示される', () => {
      render(<CancelModal {...defaultProps} />);
      expect(screen.getByText('本当によろしいですか？')).toBeInTheDocument();
    });

    it('「やめる」と「キャンセル確定」ボタンが表示される', () => {
      render(<CancelModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'やめる' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル確定' })).toBeInTheDocument();
    });

    it('isCancelling が true のとき「キャンセル処理中...」と表示される', () => {
      render(<CancelModal {...defaultProps} isCancelling={true} />);
      expect(screen.getByRole('button', { name: 'キャンセル処理中...' })).toBeInTheDocument();
    });
  });

  describe('disabled 制御', () => {
    it('isCancelling が false のとき両ボタンが有効', () => {
      render(<CancelModal {...defaultProps} isCancelling={false} />);
      expect(screen.getByRole('button', { name: 'やめる' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'キャンセル確定' })).not.toBeDisabled();
    });

    it('isCancelling が true のとき両ボタンが disabled になる', () => {
      render(<CancelModal {...defaultProps} isCancelling={true} />);
      expect(screen.getByRole('button', { name: 'やめる' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'キャンセル処理中...' })).toBeDisabled();
    });
  });

  describe('コールバックの呼び出し', () => {
    it('「やめる」クリックで onClose が呼ばれる', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<CancelModal {...defaultProps} onClose={onClose} />);
      await user.click(screen.getByRole('button', { name: 'やめる' }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('「キャンセル確定」クリックで onConfirm が呼ばれる', async () => {
      const onConfirm = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<CancelModal {...defaultProps} onConfirm={onConfirm} />);
      await user.click(screen.getByRole('button', { name: 'キャンセル確定' }));
      expect(onConfirm).toHaveBeenCalledOnce();
    });
  });
});
