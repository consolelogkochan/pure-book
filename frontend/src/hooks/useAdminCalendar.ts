import { useState, useEffect, useCallback } from 'react';
import type { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import axios from '../axios';
import type { Booking, Menu, StoreSetting } from '../types';
import type { SelectedBooking } from './useAdminEventForm';

const dayMap: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
};

interface UseAdminCalendarProps {
  refetchEvents: () => void;
}

interface UseAdminCalendarReturn {
  selectedBooking: SelectedBooking | null;
  storeSettings: StoreSetting | null;
  menus: Menu[];
  hiddenDays: number[];
  isLoading: boolean;
  fetchFailed: boolean;
  menusFetchFailed: boolean;
  fetchEvents: (
    info: { startStr: string; endStr: string },
    successCallback: (events: object[]) => void,
    failureCallback: (error: Error) => void,
  ) => Promise<void>;
  handleSelect: (info: DateSelectArg) => void;
  handleEventClick: (info: EventClickArg) => void;
  handleSuccess: () => void;
  closeDrawer: () => void;
}

export const useAdminCalendar = ({ refetchEvents }: UseAdminCalendarProps): UseAdminCalendarReturn => {
  const [selectedBooking, setSelectedBooking] = useState<SelectedBooking | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSetting | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [menusFetchFailed, setMenusFetchFailed] = useState(false);

  // 純粋な再取得のみ担う。エラー時は throw — 呼び出し元が責務に応じて処理する。
  // settings はカレンダー表示に必須のため失敗時は throw する。
  // menus はドロワーフォームのみで使用するため失敗しても throw しない。
  const fetchInitialData = async () => {
    const [settingsResult, menusResult] = await Promise.allSettled([
      axios.get('/admin/settings'),
      axios.get('/menus'),
    ]);

    if (settingsResult.status === 'rejected') throw settingsResult.reason;

    setStoreSettings(settingsResult.value.data);
    if (menusResult.status === 'fulfilled') {
      setMenus(menusResult.value.data.menus || menusResult.value.data || []);
    } else {
      setMenusFetchFailed(true);
    }
  };

  // fetchFailed のセットは初回ロード時のみ。
  useEffect(() => {
    fetchInitialData()
      .catch(() => setFetchFailed(true))
      .finally(() => setIsLoading(false));
  }, []);

  // FullCalendar の events コールバック仕様のため throw ではなく failureCallback でエラーを通知する
  const fetchEvents = useCallback(async (
    info: { startStr: string; endStr: string },
    successCallback: (events: object[]) => void,
    failureCallback: (error: Error) => void,
  ) => {
    try {
      const res = await axios.get('/admin/bookings', {
        params: { start: info.startStr, end: info.endStr },
      });

      const events = res.data.map((booking: Booking) => ({
        id: booking.id,
        title: `${booking.customer_name}様`,
        start: booking.start_time,
        end: booking.end_time,
        backgroundColor: booking.status === 'cancelled' ? '#94a3b8' : '#2563eb',
        borderColor: booking.status === 'cancelled' ? '#94a3b8' : '#2563eb',
        extendedProps: booking,
      }));

      successCallback(events);
    } catch (error) {
      console.error('予約データの取得に失敗しました', error);
      failureCallback(error as Error);
    }
  }, []);

  const handleSelect = (info: DateSelectArg) => {
    setSelectedBooking({ isNew: true, start_time: info.startStr });
  };

  const handleEventClick = (info: EventClickArg) => {
    setSelectedBooking({ isNew: false, ...(info.event.extendedProps as Booking) });
  };

  const handleSuccess = () => {
    setSelectedBooking(null);
    refetchEvents();
  };

  const closeDrawer = () => setSelectedBooking(null);

  const hiddenDays = storeSettings?.regular_holidays?.map((day: string) => dayMap[day]) || [];

  return {
    selectedBooking,
    storeSettings,
    menus,
    hiddenDays,
    isLoading,
    fetchFailed,
    menusFetchFailed,
    fetchEvents,
    handleSelect,
    handleEventClick,
    handleSuccess,
    closeDrawer,
  };
};
