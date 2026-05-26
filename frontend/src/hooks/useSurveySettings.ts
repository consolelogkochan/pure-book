import { useState, useEffect } from 'react';
import axios from '../axios';
import type { SurveyQuestion } from '../types';

interface UseSurveySettingsReturn {
  questions: SurveyQuestion[];
  isLoading: boolean;
  isSaving: boolean;
  fetchFailed: boolean;
  message: string;
  messageType: 'success' | 'error' | null;
  addSurveyQuestion: () => void;
  removeSurveyQuestion: (index: number) => void;
  updateSurveyQuestion: (index: number, newQuestion: SurveyQuestion) => void;
  handleSave: () => Promise<void>;
}

export const useSurveySettings = (): UseSurveySettingsReturn => {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  // 純粋な再取得のみ担う。エラー時は throw — 呼び出し元が責務に応じて処理する。
  const fetchSurveyQuestions = async () => {
    const res = await axios.get('/admin/survey-questions');
    const formatted = res.data.map((q: SurveyQuestion) => ({
      ...q,
      options: q.options || [],
    }));
    setQuestions(formatted);
  };

  // fetchFailed のセットは初回ロード時のみ。
  useEffect(() => {
    fetchSurveyQuestions()
      .catch(() => {
        setFetchFailed(true);
        setMessage('データの取得に失敗しました。ページを再読み込みしてください。');
        setMessageType('error');
      })
      .finally(() => setIsLoading(false));
  }, []);

  // useEffect([questions]) を使うと fetchSurveyQuestions の更新時も消えてしまうため、操作関数の冒頭で明示的にクリアする
  const addSurveyQuestion = () => {
    setMessage('');
    setQuestions(prev => [
      ...prev,
      { question_text: '', type: 'text', is_required: false, options: [] },
    ]);
  };

  const removeSurveyQuestion = (index: number) => {
    setMessage('');
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateSurveyQuestion = (index: number, newQuestion: SurveyQuestion) => {
    setMessage('');
    setQuestions(prev => prev.map((q, i) => (i === index ? newQuestion : q)));
  };

  const handleSave = async () => {
    if (isSaving || fetchFailed) return;
    setIsSaving(true);
    setMessage('');
    try {
      await axios.post('/admin/survey-questions', { questions }, {
        headers: { Accept: 'application/json' },
      });
      await fetchSurveyQuestions().catch(() => {});
      setMessage('アンケート設定を保存しました');
      setMessageType('success');
    } catch (error) {
      setMessage('保存に失敗しました。通信環境をご確認ください。');
      setMessageType('error');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    questions, isLoading, isSaving, fetchFailed,
    message, messageType,
    addSurveyQuestion, removeSurveyQuestion, updateSurveyQuestion,
    handleSave,
  };
};
