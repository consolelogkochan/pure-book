import { useState, useEffect } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { isAxiosError } from 'axios';
import axiosInstance from '../axios';
import type { Menu, SurveyQuestion } from '../types';
import { formatDateString, buildStartTime, formatSurveyResponses } from '../utils/bookingHelpers';

export interface BookingFormData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_memo?: string;
  terms_accepted: boolean;
  [key: string]: unknown;
}

interface UseBookingReturn {
  menus: Menu[];
  selectedMenu: Menu | null;
  selectedDate: Date | null;
  availableSlots: string[];
  selectedTime: string | null;
  isSubmitting: boolean;
  completedBookingRef: string | null;
  surveyQuestions: SurveyQuestion[];
  termsText: string | null;
  errorMessage: string | null;
  form: UseFormReturn<BookingFormData>;
  handleMenuSelect: (menu: Menu) => void;
  handleDateChange: (value: Date | [Date | null, Date | null] | null) => Promise<void>;
  handleTimeSelect: (slot: string) => void;
  onSubmit: (data: BookingFormData) => Promise<void>;
}


export const useBooking = (): UseBookingReturn => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedBookingRef, setCompletedBookingRef] = useState<string | null>(null);
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [termsText, setTermsText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<BookingFormData>();

  // フィールド編集時にエラーバナーをクリア（バナーとバリデーションエラーの並立を防ぐ）
  const { watch } = form;
  useEffect(() => {
    const subscription = watch(() => setErrorMessage(null));
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menusRes, surveyRes, settingsRes] = await Promise.all([
          axiosInstance.get('/menus'),
          axiosInstance.get('/survey-questions'),
          axiosInstance.get('/settings'),
        ]);

        setMenus(menusRes.data.menus || menusRes.data || []);

        const formattedSurvey = surveyRes.data.map((q: SurveyQuestion) => ({
          ...q,
          options: q.options || [],
        }));
        setSurveyQuestions(formattedSurvey);

        setTermsText(settingsRes.data.terms_text);
      } catch {
        setErrorMessage('データの取得に失敗しました。ページを再読み込みしてください。');
      }
    };
    fetchData();
  }, []);

  const handleMenuSelect = (menu: Menu) => {
    setErrorMessage(null);
    setSelectedMenu(menu);
  };

  // エラーメッセージに触れずスロットのみを更新する内部ヘルパー。
  // onSubmit の 409 後スロット再取得で呼ぶことで、エラーメッセージが消えるのを防ぐ。
  const refreshAvailableSlots = async (date: Date, menu: Menu) => {
    try {
      const response = await axiosInstance.get('/available-slots', {
        params: { date: formatDateString(date), menu_id: menu.id },
      });
      setAvailableSlots(response.data.available_slots || response.data || []);
    } catch {
      // スロット取得失敗をユーザーに通知（空き無しと区別できるようにする）
      setErrorMessage('空き時間の取得に失敗しました。日付を選び直してください。');
    }
  };

  const handleDateChange = async (value: Date | [Date | null, Date | null] | null) => {
    const date = value as Date;
    setSelectedDate(date);
    setSelectedTime(null);
    setErrorMessage(null);

    if (!selectedMenu) {
      setErrorMessage('先にメニューを選択してください。');
      return;
    }

    await refreshAvailableSlots(date, selectedMenu);
  };

  const handleTimeSelect = (slot: string) => {
    setErrorMessage(null);
    setSelectedTime(slot);
  };

  const onSubmit = async (data: BookingFormData) => {
    const menu = selectedMenu;
    const date = selectedDate;
    const time = selectedTime;
    if (!menu || !date || !time) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      menu_id: menu.id,
      start_time: buildStartTime(date, time),
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      customer_memo: data.customer_memo || null,
      survey_responses: formatSurveyResponses(data, surveyQuestions),
    };

    try {
      const response = await axiosInstance.post('/bookings', payload);
      setCompletedBookingRef(response.data.booking.booking_reference);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        if (error.response?.status === 429) {
          setErrorMessage('アクセスが集中しているか、操作が早すぎます。1分ほどお待ちいただいてから再度お試しください。');
        } else if (error.response?.status === 409) {
          setErrorMessage('申し訳ありません！タッチの差でこの時間は埋まってしまいました。別の時間をお選びください。');
          // refreshAvailableSlots で再取得することで、setErrorMessage が上書きされない
          await refreshAvailableSlots(date, menu);
        } else {
          setErrorMessage('予約の保存に失敗しました。入力内容をご確認ください。');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    menus,
    selectedMenu,
    selectedDate,
    availableSlots,
    selectedTime,
    isSubmitting,
    completedBookingRef,
    surveyQuestions,
    termsText,
    errorMessage,
    form,
    handleMenuSelect,
    handleDateChange,
    handleTimeSelect,
    onSubmit,
  };
};
