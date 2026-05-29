import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useForm } from 'react-hook-form';
import { SearchForm } from './SearchForm';
import type { Menu } from '../../types';
import type { SearchFormInputs } from '../../hooks/useAdminSearch';

interface WrapperProps {
  menus?: Menu[];
  isLoading?: boolean;
  isDownloading?: boolean;
  onSubmit?: (data: SearchFormInputs) => void;
  onDownloadCsv?: () => void;
}

const Wrapper = ({
  menus = [],
  isLoading = false,
  isDownloading = false,
  onSubmit = vi.fn(),
  onDownloadCsv = vi.fn(),
}: WrapperProps) => {
  const form = useForm<SearchFormInputs>();
  return (
    <SearchForm
      form={form}
      menus={menus}
      isLoading={isLoading}
      isDownloading={isDownloading}
      onSubmit={onSubmit}
      onDownloadCsv={onDownloadCsv}
    />
  );
};

const sampleMenus: Menu[] = [
  { id: 1, name: 'カット', duration: 60, price: 3000, description: null },
  { id: 2, name: 'カラー', duration: 90, price: 6000, description: null },
];

describe('admin/SearchForm', () => {
  describe('表示', () => {
    it('検索フォームの各入力欄が表示される', () => {
      render(<Wrapper />);
      expect(screen.getByPlaceholderText('例: 山田')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('例: BKG-...')).toBeInTheDocument();
    });

    it('menus が渡されるとセレクトボックスに選択肢が表示される', () => {
      render(<Wrapper menus={sampleMenus} />);
      expect(screen.getByRole('option', { name: 'カット' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'カラー' })).toBeInTheDocument();
    });

    it('isLoading が false のとき「検索する」と表示される', () => {
      render(<Wrapper isLoading={false} />);
      expect(screen.getByRole('button', { name: '検索する' })).toBeInTheDocument();
    });

    it('isLoading が true のとき「検索中...」と表示される', () => {
      render(<Wrapper isLoading={true} />);
      expect(screen.getByRole('button', { name: '検索中...' })).toBeInTheDocument();
    });

    it('isDownloading が false のとき「CSV出力」と表示される', () => {
      render(<Wrapper isDownloading={false} />);
      expect(screen.getByRole('button', { name: /CSV出力/ })).toBeInTheDocument();
    });

    it('isDownloading が true のとき「ダウンロード中...」と表示される', () => {
      render(<Wrapper isDownloading={true} />);
      expect(screen.getByRole('button', { name: /ダウンロード中.../ })).toBeInTheDocument();
    });
  });

  describe('ボタンの disabled 制御', () => {
    it('isLoading が false のとき検索ボタンが有効', () => {
      render(<Wrapper isLoading={false} />);
      expect(screen.getByRole('button', { name: '検索する' })).not.toBeDisabled();
    });

    it('isLoading が true のとき検索ボタンが disabled になる', () => {
      render(<Wrapper isLoading={true} />);
      expect(screen.getByRole('button', { name: '検索中...' })).toBeDisabled();
    });

    it('isDownloading が false のとき CSV ボタンが有効', () => {
      render(<Wrapper isDownloading={false} />);
      expect(screen.getByRole('button', { name: /CSV出力/ })).not.toBeDisabled();
    });

    it('isDownloading が true のとき CSV ボタンが disabled になる', () => {
      render(<Wrapper isDownloading={true} />);
      expect(screen.getByRole('button', { name: /ダウンロード中.../ })).toBeDisabled();
    });
  });

  describe('コールバックの呼び出し', () => {
    it('フォームを送信すると onSubmit が呼ばれる', async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();
      render(<Wrapper onSubmit={onSubmit} />);
      await user.click(screen.getByRole('button', { name: '検索する' }));
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    it('CSV ボタンクリックで onDownloadCsv が呼ばれる', async () => {
      const onDownloadCsv = vi.fn();
      const user = userEvent.setup();
      render(<Wrapper onDownloadCsv={onDownloadCsv} />);
      await user.click(screen.getByRole('button', { name: /CSV出力/ }));
      expect(onDownloadCsv).toHaveBeenCalledOnce();
    });

    it('フォーム送信時に入力値が onSubmit に渡される', async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();
      render(<Wrapper onSubmit={onSubmit} />);
      await user.type(screen.getByPlaceholderText('例: 山田'), '山田');
      await user.click(screen.getByRole('button', { name: '検索する' }));
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: '山田' }),
        expect.anything()
      );
    });
  });
});
