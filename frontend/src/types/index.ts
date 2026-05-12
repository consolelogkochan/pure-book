// ============================================================
// ドメイン共通型定義
// ============================================================

// --- Booking ---

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

/**
 * 支払いステータス。
 * DBのデフォルト値は null だが、フロントエンドでは 'unpaid' として扱う。
 */
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface Booking {
  id: number;
  booking_reference: string;
  user_id: number | null;
  staff_id: number;
  menu_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_memo: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  /** FullCalendar表示・フォームのデフォルト値設定で使用 */
  menu: Menu | null;
  /** 担当スタッフ情報（一覧表示で使用） */
  staff: Staff | null;
  /** アンケート回答（{ 質問文: 回答 } 形式） */
  survey_responses: Record<string, unknown> | null;
}

// --- Menu ---

export interface Menu {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
  /** 管理画面での表示制御に使用。顧客向けAPIは有効メニューのみ返すため省略可 */
  is_active?: boolean;
}

// --- Staff ---

export interface StaffSchedule {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface Staff {
  id: number;
  name: string;
  role: string | null;
  /** スタッフ管理画面で使用 */
  is_active?: boolean;
  /** シフト管理画面で使用 */
  schedule?: StaffSchedule | null;
}

// --- SurveyQuestion ---

export interface SurveyQuestion {
  /** 既存設問はIDあり。新規作成時はIDなし */
  id?: number;
  question_text: string;
  type: 'text' | 'radio' | 'checkbox';
  options: string[];
  is_required: boolean;
}

// --- BookingSearch ---

export interface SearchFormData {
  booking_reference: string;
  email: string;
}

// --- Search ---

export interface PaginationInfo {
  current_page: number;
  last_page: number;
  total: number;
}

export interface DisplayBooking extends Booking {
  formattedSurveyResponse: string;
}

// --- Settings ---

export interface StoreSetting {
  open_time: string;
  close_time: string;
  regular_holidays: string[];
  terms_text: string;
  booking_deadline_type: 'time_based' | 'date_based';
  booking_deadline_hours: number;
  booking_deadline_days: number;
  booking_deadline_time: string;
  cancel_deadline_hours: number;
}
