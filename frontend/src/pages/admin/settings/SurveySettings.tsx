import { useState, useEffect } from 'react';
import axios from '../../../axios';
import { Button } from '../../../components/Button';
import type { SurveyQuestion } from '../../../types';

export const SurveySettings = () => {
  const [questions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSurveyQuestions = async () => {
    try {
      const res = await axios.get('/admin/survey-questions');
      const formattedData = res.data.map((q: SurveyQuestion) => ({
        ...q,
        options: q.options || [] 
      }));
      
      // 整形したデータをStateにセットする
      setSurveyQuestions(formattedData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveyQuestions();
  }, []);

  // 質問の追加
  const addSurveyQuestion = () => {
    setSurveyQuestions([...questions, { question_text: '', type: 'text', options: [], is_required: false }]);
  };

  // 質問の削除
  const removeSurveyQuestion = (index: number) => {
    setSurveyQuestions(questions.filter((_, i) => i !== index));
  };

  // 質問内容の更新
  const updateSurveyQuestion = (index: number, fields: Partial<SurveyQuestion>) => {
    const newSurveyQuestions = [...questions];
    newSurveyQuestions[index] = { ...newSurveyQuestions[index], ...fields };
    setSurveyQuestions(newSurveyQuestions);
  };

  // 選択肢の追加
  const addOption = (qIndex: number) => {
    const newSurveyQuestions = [...questions];
    newSurveyQuestions[qIndex].options.push('');
    setSurveyQuestions(newSurveyQuestions);
  };

  const handleSave = async () => {
    try {
      await axios.post('/admin/survey-questions', { questions });
      alert('アンケート設定を保存しました');
      fetchSurveyQuestions(); // 保存後に最新のデータを再取得
    } catch (error) {
      alert('保存に失敗しました');
    }
  };

  if (isLoading) return <div className="p-4">読み込み中...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-2 gap-4 sm:gap-0">
        <h2 className="text-xl font-bold text-slate-800">予約時アンケート設定</h2>
        <Button onClick={handleSave} colorClass="bg-blue-600 hover:bg-blue-700 py-2 px-4 text-sm w-full sm:w-auto">保存する</Button>
      </div>

      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 relative">
            <button onClick={() => removeSurveyQuestion(qIndex)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 text-sm">削除</button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">質問文</label>
                <input 
                  type="text" 
                  value={q.question_text} 
                  onChange={e => updateSurveyQuestion(qIndex, { question_text: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="例: 当店を知ったきっかけは？"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">回答形式</label>
                <select 
                  value={q.type} 
                  onChange={e => updateSurveyQuestion(qIndex, { type: e.target.value as any, options: e.target.value === 'text' ? [] : [''] })}
                  className="w-full border rounded px-3 py-2 bg-white"
                >
                  <option value="text">テキスト入力（自由記述）</option>
                  <option value="radio">ラジオボタン（単一選択）</option>
                  <option value="checkbox">チェックボックス（複数選択）</option>
                </select>
              </div>
            </div>

            {/* 選択肢の設定（ラジオ・チェックボックスのみ） */}
            {q.type !== 'text' && (
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase">選択肢</label>
                {q.options?.map((opt, oIndex) => (
                  <div key={oIndex} className="flex gap-2">
                    <input 
                      type="text" 
                      value={opt} 
                      onChange={e => {
                        const newOpts = [...q.options];
                        newOpts[oIndex] = e.target.value;
                        updateSurveyQuestion(qIndex, { options: newOpts });
                      }}
                      className="flex-1 border rounded px-3 py-1 text-sm"
                    />
                    <button onClick={() => {
                      const newOpts = q.options.filter((_, i) => i !== oIndex);
                      updateSurveyQuestion(qIndex, { options: newOpts });
                    }} className="text-red-400">×</button>
                  </div>
                ))}
                <button onClick={() => addOption(qIndex)} className="text-sm text-blue-600 font-bold">+ 選択肢を追加</button>
              </div>
            )}

            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={q.is_required} 
                onChange={e => updateSurveyQuestion(qIndex, { is_required: e.target.checked })}
              />
              <span className="text-sm font-bold text-slate-600">この質問を必須にする</span>
            </label>
          </div>
        ))}

        <button 
          onClick={addSurveyQuestion}
          className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-400 transition-all"
        >
          + 新しい質問を追加する
        </button>
      </div>
    </div>
  );
};