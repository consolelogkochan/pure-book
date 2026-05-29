import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useForm } from 'react-hook-form';
import { SearchForm } from './SearchForm';
import type { SearchFormData } from '../../types';

// useForm を注入するためのラッパーコンポーネント
interface WrapperProps {
  isSearching?: boolean;
  onSearch?: (data: SearchFormData) => Promise<void>;
}

const Wrapper = ({ isSearching = false, onSearch = vi.fn<(data: SearchFormData) => Promise<void>>().mockResolvedValue(undefined) }: WrapperProps) => {
  const form = useForm<SearchFormData>();
  return <SearchForm form={form} isSearching={isSearching} onSearch={onSearch} />;
};

describe('booking/SearchForm', () => {
  describe('表示', () => {
    it('予約照会番号とメールアドレスの入力欄が表示される', () => {
      render(<Wrapper />);
      expect(screen.getByPlaceholderText('例: BKG-XXXXX')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('例: taro@example.com')).toBeInTheDocument();
    });

    it('isSearching が false のとき「予約を検索する」と表示される', () => {
      render(<Wrapper isSearching={false} />);
      expect(screen.getByRole('button', { name: '予約を検索する' })).toBeInTheDocument();
    });

    it('isSearching が true のとき「検索中...」と表示される', () => {
      render(<Wrapper isSearching={true} />);
      expect(screen.getByRole('button', { name: '検索中...' })).toBeInTheDocument();
    });
  });

  describe('送信ボタンの disabled 制御', () => {
    it('isSearching が false のとき送信ボタンが有効', () => {
      render(<Wrapper isSearching={false} />);
      expect(screen.getByRole('button', { name: '予約を検索する' })).not.toBeDisabled();
    });

    it('isSearching が true のとき送信ボタンが disabled になる', () => {
      render(<Wrapper isSearching={true} />);
      expect(screen.getByRole('button', { name: '検索中...' })).toBeDisabled();
    });
  });

  describe('バリデーション', () => {
    it('未入力で送信すると両フィールドのエラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      render(<Wrapper />);
      await user.click(screen.getByRole('button', { name: '予約を検索する' }));
      await waitFor(() => {
        expect(screen.getByText('予約番号を入力してください')).toBeInTheDocument();
        expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument();
      });
    });

    it('予約番号のみ未入力で送信すると予約番号のエラーが表示される', async () => {
      const user = userEvent.setup();
      render(<Wrapper />);
      await user.type(screen.getByPlaceholderText('例: taro@example.com'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: '予約を検索する' }));
      await waitFor(() => {
        expect(screen.getByText('予約番号を入力してください')).toBeInTheDocument();
        expect(screen.queryByText('メールアドレスを入力してください')).not.toBeInTheDocument();
      });
    });
  });

  describe('フォーム送信', () => {
    it('両フィールドを入力して送信すると onSearch が正しい値で呼ばれる', async () => {
      const onSearch = vi.fn<(data: SearchFormData) => Promise<void>>().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<Wrapper onSearch={onSearch} />);
      await user.type(screen.getByPlaceholderText('例: BKG-XXXXX'), 'BKG-TEST1234');
      await user.type(screen.getByPlaceholderText('例: taro@example.com'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: '予約を検索する' }));
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith(
          { booking_reference: 'BKG-TEST1234', email: 'test@example.com' },
          expect.anything()
        );
      });
    });

    it('バリデーションエラーがある場合 onSearch は呼ばれない', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      render(<Wrapper onSearch={onSearch} />);
      await user.click(screen.getByRole('button', { name: '予約を検索する' }));
      await waitFor(() => {
        expect(screen.getByText('予約番号を入力してください')).toBeInTheDocument();
      });
      expect(onSearch).not.toHaveBeenCalled();
    });
  });
});
