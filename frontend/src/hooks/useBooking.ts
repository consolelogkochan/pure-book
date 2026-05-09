import { useState, useEffect } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { isAxiosError } from 'axios';
import axiosInstance from '../axios';
import type { Menu, SurveyQuestion } from '../types';

export interface BookingFormData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_memo?: string;
  terms_accepted: boolean;
  [key: string]: unknown;
}

interface UseBookingReturn {
  // 状態
  menus: Menu[];
  selectedMenu: Menu | null;
  selectedDate: Date | null;
  availableSlots: string[];
  selectedTime: string | null;
  isSubmitting: boolean;
  completedBookingRef: string | null;
  surveyQuestions: SurveyQuestion[];
  termsText: string | null;
  // フォーム
  form: UseFormReturn<BookingFormData>;
  // アクション
  handleMenuSelect: (menu: Menu) => void;
  handleDateChange: (value: Date | [Date | null, Date | null] | null) => Promise<void>;
  handleTimeSelect: (slot: string) => void;
  onSubmit: (data: BookingFormData) => Promise<void>;
}

const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildStartTime = (date: Date, time: string): string => {
  return `${formatDateString(date)} ${time}:00`;
};

const formatSurveyResponses = (
  data: BookingFormData,
  questions: SurveyQuestion[]
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  questions.forEach(q => {
    const answer = data[`survey_${q.id}`];
    if (answer) {
      result[q.question_text] = answer;
    }
  });
  return result;
};

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

  const form = useForm<BookingFormData>();

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
      } catch (error) {
        console.error('データの取得に失敗しました', error);
      }
    };
    fetchData();
  }, []);

  const handleMenuSelect = (menu: Menu) => {
    setSelectedMenu(menu);
  };

  const handleDateChange = async (value: Date | [Date | null, Date | null] | null) => {
    const date = value as Date;
    setSelectedDate(date);
    setSelectedTime(null);

    if (!selectedMenu) {
      alert('先にメニューを選択してください');
      return;
    }

    try {
      const response = await axiosInstance.get('/available-slots', {
        params: { date: formatDateString(date), menu_id: selectedMenu.id },
      });
      setAvailableSlots(response.data.available_slots || response.data || []);
    } catch (error) {
      console.error('空き時間の取得に失敗しました', error);
    }
  };

  const handleTimeSelect = (slot: string) => {
    setSelectedTime(slot);
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedMenu || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);

    const payload = {
      menu_id: selectedMenu.id,
      start_time: buildStartTime(selectedDate, selectedTime),
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
          alert('アクセスが集中しているか、操作が早すぎます。1分ほどお待ちいただいてから再度お試しください。');
          return;
        }
        if (error.response?.status === 409) {
          alert('申し訳ありません！タッチの差でこの時間は埋まってしまいました。別の時間をお選びください。');
          if (selectedDate) {
            await handleDateChange(selectedDate);
          }
        } else {
          alert('予約の保存に失敗しました。入力内容をご確認ください。');
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
    form,
    handleMenuSelect,
    handleDateChange,
    handleTimeSelect,
    onSubmit,
  };
};
