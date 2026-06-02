import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BookingTable } from './BookingTable';
import type { DisplayBooking } from '../../types';

const makeBooking = (overrides: Partial<DisplayBooking> = {}): DisplayBooking => ({
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
  menu: { id: 1, name: 'カット', duration: 60, price: 3000, description: null },
  staff: { id: 1, name: '田中 花子', role: null },
  survey_responses: null,
  formattedSurveyResponse: 'なし',
  ...overrides,
});

const defaultProps = {
  isLoading: false,
  isSaving: false,
  onStatusChange: vi.fn(),
};

describe('BookingTable', () => {
  describe('空・ローディング状態', () => {
    it('results が空で isLoading のとき「読み込み中...」が表示される', () => {
      render(<BookingTable {...defaultProps} results={[]} isLoading={true} />);
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('results が空で isLoading が false のとき「条件に一致する予約が見つかりませんでした」が表示される', () => {
      render(<BookingTable {...defaultProps} results={[]} isLoading={false} />);
      expect(screen.getByText('条件に一致する予約が見つかりませんでした。')).toBeInTheDocument();
    });
  });

  describe('予約データの表示', () => {
    it('予約番号と顧客名が表示される', () => {
      render(<BookingTable {...defaultProps} results={[makeBooking()]} />);
      expect(screen.getByText('BKG-TEST1234')).toBeInTheDocument();
      expect(screen.getByText('テスト 太郎')).toBeInTheDocument();
    });

    it('staff が null のとき「未定」と表示される', () => {
      render(<BookingTable {...defaultProps} results={[makeBooking({ staff: null })]} />);
      expect(screen.getByText('未定')).toBeInTheDocument();
    });

    it('formattedSurveyResponse が「なし」のとき「-」が表示される', () => {
      render(<BookingTable {...defaultProps} results={[makeBooking({ formattedSurveyResponse: 'なし' })]} />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('formattedSurveyResponse が「なし」以外のとき値が表示される', () => {
      render(<BookingTable {...defaultProps} results={[makeBooking({ formattedSurveyResponse: '来店のきっかけ: SNS' })]} />);
      expect(screen.getByText('来店のきっかけ: SNS')).toBeInTheDocument();
    });
  });

  describe('payment_status バッジの表示', () => {
    it('paid のとき「事前決済済」と表示される', () => {
      render(<BookingTable {...defaultProps} results={[makeBooking({ payment_status: 'paid' })]} />);
      expect(screen.getByText('事前決済済')).toBeInTheDocument();
    });

    it('refunded のとき「返金済」と表示される', () => {
      render(<BookingTable {...defaultProps} results={[makeBooking({ payment_status: 'refunded' })]} />);
      expect(screen.getByText('返金済')).toBeInTheDocument();
    });

    it('unpaid のとき「未決済」と表示される', () => {
      render(<BookingTable {...defaultProps} results={[makeBooking({ payment_status: 'unpaid' })]} />);
      expect(screen.getByText('未決済')).toBeInTheDocument();
    });
  });

  describe('ステータス変更', () => {
    it('isSaving のとき select が disabled になる', () => {
      render(<BookingTable {...defaultProps} results={[makeBooking()]} isSaving={true} />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('isSaving が false のとき select が有効', () => {
      render(<BookingTable {...defaultProps} results={[makeBooking()]} isSaving={false} />);
      expect(screen.getByRole('combobox')).not.toBeDisabled();
    });

    it('ステータス変更で onStatusChange が id と新ステータスで呼ばれる', async () => {
      const onStatusChange = vi.fn();
      const user = userEvent.setup();
      render(
        <BookingTable {...defaultProps} results={[makeBooking({ id: 1, status: 'confirmed' })]} onStatusChange={onStatusChange} />
      );
      await user.selectOptions(screen.getByRole('combobox'), 'cancelled');
      expect(onStatusChange).toHaveBeenCalledWith(1, 'cancelled');
    });
  });
});
