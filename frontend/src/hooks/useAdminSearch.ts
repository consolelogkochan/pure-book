import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  isSaving: boolean;
  isDownloading: boolean;
  pagination: PaginationInfo | null;
  message: string;
  messageType: 'success' | 'error' | null;
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
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  // Issue 5: 成功バナー自動消去タイマー（refs は useCallback 依存なしで参照可能）
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  // 純粋な再取得のみ担う。エラー時は throw — 呼び出し元が責務に応じて処理する。
  // Issue 2: タイマーをクリアして次の操作のメッセージと競合しないようにする
  const fetchSearchResults = useCallback(async (params: Partial<SearchFormInputs>, page: number = 1) => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setIsLoading(true);
    setResults([]);
    setMessage('');
    setMessageType(null);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Issue 4: メニュー取得失敗をインラインバナーで通知
  useEffect(() => {
    Promise.all([
      axios.get('/menus')
        .then(res => setMenus(res.data.menus || res.data || []))
        .catch(() => {
          setMessage('メニューの取得に失敗しました。ページを再読み込みしてください。');
          setMessageType('error');
        }),
      fetchSearchResults({}, 1)
        .catch(() => {
          setMessage('検索に失敗しました。通信環境をご確認ください。');
          setMessageType('error');
        }),
    ]);
  }, [fetchSearchResults]);

  const displayResults = useMemo<DisplayBooking[]>(
    () => results.map(booking => ({
      ...booking,
      formattedSurveyResponse: formatSurveyResponse(booking.survey_responses),
    })),
    [results],
  );

  // Issue 2: isSaving 中の並行実行を防止（fetchSearchResults との競合を避ける）
  const onSubmit = (data: SearchFormInputs) => {
    if (isSaving) return;
    fetchSearchResults(data, 1).catch(() => {
      setMessage('検索に失敗しました。通信環境をご確認ください。');
      setMessageType('error');
    });
  };

  // Issue 3: isDownloading ガードで連打による重複ダウンロードを防止
  const handleDownloadCsv = async () => {
    if (isDownloading) return;
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setIsDownloading(true);
    setMessage('');
    setMessageType(null);
    try {
      const response = await axios.get('/admin/bookings/csv', {
        params: form.getValues(),
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      downloadBlob(blob, `予約一覧_${new Date().getTime()}.csv`);
    } catch {
      setMessage('CSVのダウンロードに失敗しました。');
      setMessageType('error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: BookingStatus) => {
    if (isSaving) return;
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setIsSaving(true);
    setMessage('');
    setMessageType(null);
    try {
      await axios.patch(`/admin/bookings/${id}/status`, { status: newStatus });
      // Issue 1: ローカル更新ではなくサーバーを再フェッチして payment_status の変化も反映
      // fetchSearchResults は成功時にメッセージをクリアするため、成功メッセージは再フェッチ後にセット
      await fetchSearchResults(form.getValues(), pagination?.current_page ?? 1).catch(() => {});
      setMessage('ステータスを更新しました');
      setMessageType('success');
      // Issue 5: 成功バナーを3秒後に自動消去
      dismissTimerRef.current = setTimeout(() => {
        setMessage('');
        setMessageType(null);
      }, 3000);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('ステータスの更新に失敗しました。通信環境をご確認ください。');
      }
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Issue 2: isSaving 中のページ変更を防止（fetchSearchResults との競合を避ける）
  const handlePageChange = (page: number) => {
    if (isSaving) return;
    fetchSearchResults(form.getValues(), page).catch(() => {
      setMessage('検索に失敗しました。通信環境をご確認ください。');
      setMessageType('error');
    });
  };

  return {
    form,
    displayResults,
    menus,
    isLoading,
    isSaving,
    isDownloading,
    pagination,
    message,
    messageType,
    onSubmit,
    handleDownloadCsv,
    handleStatusChange,
    handlePageChange,
  };
};
