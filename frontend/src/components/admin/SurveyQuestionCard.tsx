import type { SurveyQuestion } from '../../types';

// index を渡す代わりに呼び出し元で束縛済みの関数を受け取り、コンポーネントの責務を描画のみに限定する
// isSaving は受け取らず、親の fieldset disabled で一括制御する
interface Props {
  question: SurveyQuestion;
  updateQuestion: (newQuestion: SurveyQuestion) => void;
  removeQuestion: () => void;
}

export const SurveyQuestionCard = ({ question, updateQuestion, removeQuestion }: Props) => {
  const hasOptions = question.type !== 'text';

  const handleTypeChange = (newType: SurveyQuestion['type']) => {
    updateQuestion({
      ...question,
      type: newType,
      // text に変更したら選択肢を空にし、text 以外に変更したら既存選択肢を維持（なければ空1つ追加）
      options: newType === 'text' ? [] : (question.options.length > 0 ? question.options : ['']),
    });
  };

  const handleAddOption = () => {
    updateQuestion({ ...question, options: [...question.options, ''] });
  };

  const handleRemoveOption = (oIndex: number) => {
    updateQuestion({
      ...question,
      options: question.options.filter((_, i) => i !== oIndex),
    });
  };

  const handleUpdateOption = (oIndex: number, value: string) => {
    updateQuestion({
      ...question,
      options: question.options.map((opt, i) => (i === oIndex ? value : opt)),
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 relative">
      <button
        onClick={removeQuestion}
        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        削除
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">質問文</label>
          <input
            type="text"
            value={question.question_text}
            onChange={e => updateQuestion({ ...question, question_text: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="例: 当店を知ったきっかけは？"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">回答形式</label>
          <select
            value={question.type}
            onChange={e => handleTypeChange(e.target.value as SurveyQuestion['type'])}
            className="w-full border rounded px-3 py-2 bg-white"
          >
            <option value="text">テキスト入力（自由記述）</option>
            <option value="radio">ラジオボタン（単一選択）</option>
            <option value="checkbox">チェックボックス（複数選択）</option>
          </select>
        </div>
      </div>

      {hasOptions && (
        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
          <label className="block text-xs font-bold text-slate-500 uppercase">選択肢</label>
          {question.options.map((opt, oIndex) => (
            <div key={oIndex} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={e => handleUpdateOption(oIndex, e.target.value)}
                className="flex-1 border rounded px-3 py-1 text-sm"
              />
              <button
                onClick={() => handleRemoveOption(oIndex)}
                className="text-red-400 hover:text-red-600 disabled:opacity-40"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={handleAddOption}
            className="text-sm text-blue-600 font-bold hover:text-blue-700"
          >
            + 選択肢を追加
          </button>
        </div>
      )}

      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={question.is_required}
          onChange={e => updateQuestion({ ...question, is_required: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
        />
        <span className="text-sm font-bold text-slate-600">この質問を必須にする</span>
      </label>
    </div>
  );
};
