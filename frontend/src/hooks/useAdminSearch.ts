import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { isAxiosError } from 'axios';
import axios from '../axios';
import type { Booking, BookingStatus, DisplayBooking, Menu, PaginationInfo } from '../types';
import { downloadBlob } from '../utils/downloadBlob';

export interface SearchFormInputs {
  date: string;
  name: string;
  reference: string;
  menu: string;
  status: string;
}

interface UseAdminSearchReturn {
  form: UseFormReturn<SearchFormInputs>;
  displayResults: DisplayBooking[];
  menus: Menu[];
  isLoading: boolean;
  pagination: PaginationInfo | null;
  onSubmit: (data: SearchFormInputs) => void;
  handleDownloadCsv: () => Promise<void>;
  handleStatusChange: (id: number, newStatus: BookingStatus) => Promise<void>;
  handlePageChange: (page: number) => void;
}

const formatSurveyResponse = (responses: Record<string, unknown> | null): string => {
  if (!responses || typeof responses !== 'object') return 'なし';
  return Object.entries(responses).map(([question, answer]) => {
    const answerText = Array.isArray(answer) ? answer.join(', ') : String(answer);
    return `${question}: ${answerText}`;
  }).join(' / ');
};

export const useAdminSearch = (): UseAdminSearchReturn => {
  const form = useForm<SearchFormInputs>();
  const [results, setResults] = useState<Booking[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Issue 4: 検索開始時に結果をリセットして古いデータが残らないようにする
  const fetchSearchResults = useCallback(async (params: Partial<SearchFormInputs>, page: number = 1) => {
    setIsLoading(true);
    setResults([]);
    try {
      const res = await axios.get('/admin/bookings/search', {
        params: { ...params, page },
      });
      setResults(res.data.data);
      setPagination({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total,
      });
    } catch {
      alert('検索に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Issue 3: メニュー取得と初期検索を独立して実行し、片方の失敗がもう片方に影響しないようにする
  useEffect(() => {
    Promise.all([
      axios.get('/menus')
        .then(res => setMenus(res.data.menus || res.data || []))
        .catch(err => console.error('メニューの取得に失敗しました', err)),
      fetchSearchResults({}, 1),
    ]);
  }, [fetchSearchResults]);

  const displayResults = useMemo<DisplayBooking[]>(
    () => results.map(booking => ({
      ...booking,
      formattedSurveyResponse: formatSurveyResponse(booking.survey_responses),
    })),
    [results],
  );

  const onSubmit = (data: SearchFormInputs) => {
    fetchSearchResults(data, 1);
  };

  // Issue 5: DOM操作をdownloadBlobユーティリティに委譲
  const handleDownloadCsv = async () => {
    const currentParams = form.getValues();
    try {
      const response = await axios.get('/admin/bookings/csv', {
        params: currentParams,
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      downloadBlob(blob, `予約一覧_${new Date().getTime()}.csv`);
    } catch {
      alert('CSVのダウンロードに失敗しました');
    }
  };

  const handleStatusChange = async (id: number, newStatus: BookingStatus) => {
    try {
      await axios.patch(`/admin/bookings/${id}/status`, { status: newStatus });
      alert('ステータスを更新しました');
      setResults(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('ステータスの更新に失敗しました');
      }
    }
  };

  const handlePageChange = (page: number) => {
    fetchSearchResults(form.getValues(), page);
  };

  return {
    form,
    displayResults,
    menus,
    isLoading,
    pagination,
    onSubmit,
    handleDownloadCsv,
    handleStatusChange,
    handlePageChange,
  };
};
