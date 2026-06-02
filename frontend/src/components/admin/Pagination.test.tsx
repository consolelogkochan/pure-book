import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from './Pagination';
import type { PaginationInfo } from '../../types';

const makePagination = (overrides: Partial<PaginationInfo> = {}): PaginationInfo => ({
  current_page: 2,
  last_page: 5,
  total: 50,
  ...overrides,
});

describe('Pagination', () => {
  describe('非表示条件', () => {
    it('pagination が null のとき何も表示しない', () => {
      const { container } = render(<Pagination pagination={null} onPageChange={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it('last_page が 1 のとき何も表示しない', () => {
      const { container } = render(
        <Pagination pagination={makePagination({ last_page: 1 })} onPageChange={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('表示', () => {
    it('現在ページと総件数が表示される', () => {
      render(<Pagination pagination={makePagination()} onPageChange={vi.fn()} />);
      expect(screen.getByText(/全 50 件中 2 ページ目/)).toBeInTheDocument();
    });

    it('「前へ」「次へ」ボタンが表示される', () => {
      render(<Pagination pagination={makePagination()} onPageChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: '前へ' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '次へ' })).toBeInTheDocument();
    });
  });

  describe('disabled 制御', () => {
    it('1ページ目のとき「前へ」ボタンが disabled になる', () => {
      render(
        <Pagination pagination={makePagination({ current_page: 1 })} onPageChange={vi.fn()} />
      );
      expect(screen.getByRole('button', { name: '前へ' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '次へ' })).not.toBeDisabled();
    });

    it('最終ページのとき「次へ」ボタンが disabled になる', () => {
      render(
        <Pagination pagination={makePagination({ current_page: 5 })} onPageChange={vi.fn()} />
      );
      expect(screen.getByRole('button', { name: '次へ' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '前へ' })).not.toBeDisabled();
    });

    it('中間ページのとき両ボタンが有効', () => {
      render(<Pagination pagination={makePagination()} onPageChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: '前へ' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: '次へ' })).not.toBeDisabled();
    });
  });

  describe('コールバック', () => {
    it('「前へ」クリックで current_page - 1 が渡される', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();
      render(<Pagination pagination={makePagination({ current_page: 3 })} onPageChange={onPageChange} />);
      await user.click(screen.getByRole('button', { name: '前へ' }));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('「次へ」クリックで current_page + 1 が渡される', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();
      render(<Pagination pagination={makePagination({ current_page: 3 })} onPageChange={onPageChange} />);
      await user.click(screen.getByRole('button', { name: '次へ' }));
      expect(onPageChange).toHaveBeenCalledWith(4);
    });
  });
});
