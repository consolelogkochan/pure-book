import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BookingResultCard } from './BookingResultCard';
import type { Booking } from '../../types';

// CheckoutForm は Stripe に依存するためスタブに差し替える
vi.mock('./CheckoutForm', () => ({
  CheckoutForm: () => <div data-testid="checkout-form" />,
}));

const baseBooking: Booking = {
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

const defaultProps = {
  booking: baseBooking,
  showPayment: false,
  onShowPayment: vi.fn(),
  onHidePayment: vi.fn(),
  onPaymentSuccess: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  onCancelRequest: vi.fn(),
};

describe('BookingResultCard', () => {
  describe('予約情報の表示', () => {
    it('顧客名が表示される', () => {
      render(<BookingResultCard {...defaultProps} />);
      expect(screen.getByText(/テスト 太郎/)).toBeInTheDocument();
    });

    it('status が "confirmed" のとき「予約確定」と表示される', () => {
      render(<BookingResultCard {...defaultProps} />);
      expect(screen.getByText('予約確定')).toBeInTheDocument();
    });

    it('status が "cancelled" のとき「キャンセル済み」と表示される', () => {
      const booking = { ...baseBooking, status: 'cancelled' as const };
      render(<BookingResultCard {...defaultProps} booking={booking} />);
      expect(screen.getByText('キャンセル済み')).toBeInTheDocument();
    });

    it('payment_status が "paid" のとき「事前決済済み」と表示される', () => {
      const booking = { ...baseBooking, payment_status: 'paid' as const };
      render(<BookingResultCard {...defaultProps} booking={booking} />);
      expect(screen.getByText('事前決済済み')).toBeInTheDocument();
    });

    it('payment_status が "unpaid" のとき「当日店舗支払い（未決済）」と表示される', () => {
      render(<BookingResultCard {...defaultProps} />);
      expect(screen.getByText('当日店舗支払い（未決済）')).toBeInTheDocument();
    });

    it('payment_status が "refunded" のとき「返金済み」と表示される', () => {
      const booking = { ...baseBooking, payment_status: 'refunded' as const };
      render(<BookingResultCard {...defaultProps} booking={booking} />);
      expect(screen.getByText('返金済み')).toBeInTheDocument();
    });
  });

  describe('ボタン表示の条件分岐', () => {
    it('confirmed + unpaid のとき決済ボタンとキャンセルボタンが表示される', () => {
      render(<BookingResultCard {...defaultProps} />);
      expect(screen.getByRole('button', { name: /オンラインで事前決済する/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'この予約をキャンセルする' })).toBeInTheDocument();
    });

    it('confirmed + paid のとき決済ボタンは表示されずキャンセルボタンのみ表示される', () => {
      const booking = { ...baseBooking, payment_status: 'paid' as const };
      render(<BookingResultCard {...defaultProps} booking={booking} />);
      expect(screen.queryByRole('button', { name: /オンラインで事前決済する/ })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'この予約をキャンセルする' })).toBeInTheDocument();
    });

    it('cancelled のとき両ボタンとも表示されない', () => {
      const booking = { ...baseBooking, status: 'cancelled' as const };
      render(<BookingResultCard {...defaultProps} booking={booking} />);
      expect(screen.queryByRole('button', { name: /オンラインで事前決済する/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'この予約をキャンセルする' })).not.toBeInTheDocument();
    });

    it('showPayment が true のときキャンセルボタンが非表示になる', () => {
      render(<BookingResultCard {...defaultProps} showPayment={true} />);
      expect(screen.queryByRole('button', { name: 'この予約をキャンセルする' })).not.toBeInTheDocument();
    });

    it('showPayment が true のとき CheckoutForm が表示される', () => {
      render(<BookingResultCard {...defaultProps} showPayment={true} />);
      expect(screen.getByTestId('checkout-form')).toBeInTheDocument();
    });
  });

  describe('コールバックの呼び出し', () => {
    it('決済ボタンクリックで onShowPayment が呼ばれる', async () => {
      const onShowPayment = vi.fn();
      const user = userEvent.setup();
      render(<BookingResultCard {...defaultProps} onShowPayment={onShowPayment} />);
      await user.click(screen.getByRole('button', { name: /オンラインで事前決済する/ }));
      expect(onShowPayment).toHaveBeenCalledOnce();
    });

    it('キャンセルボタンクリックで onCancelRequest が呼ばれる', async () => {
      const onCancelRequest = vi.fn();
      const user = userEvent.setup();
      render(<BookingResultCard {...defaultProps} onCancelRequest={onCancelRequest} />);
      await user.click(screen.getByRole('button', { name: 'この予約をキャンセルする' }));
      expect(onCancelRequest).toHaveBeenCalledOnce();
    });
  });
});
