import { useSurveySettings } from '../../../hooks/useSurveySettings';
import { SurveyQuestionCard } from '../../../components/admin/SurveyQuestionCard';
import { Button } from '../../../components/Button';

export const SurveySettings = () => {
  const {
    questions, isLoading, isSaving, fetchFailed,
    message, messageType,
    addSurveyQuestion, removeSurveyQuestion, updateSurveyQuestion,
    handleSave,
  } = useSurveySettings();

  if (isLoading) return <div className="p-4 text-slate-500">読み込み中...</div>;

  const saveDisabled = isSaving || fetchFailed;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="border-b pb-2">
        <h2 className="text-xl font-bold text-slate-800">予約時アンケート設定</h2>
        <p className="text-sm text-slate-500 mt-1">予約時にお客様へ表示するアンケートを設定します。</p>
      </div>

      <fieldset disabled={isSaving} className="border-0 p-0 m-0">
        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <SurveyQuestionCard
              key={q.id != null ? `q-${q.id}` : `new-${qIndex}`}
              question={q}
              updateQuestion={newQ => updateSurveyQuestion(qIndex, newQ)}
              removeQuestion={() => removeSurveyQuestion(qIndex)}
            />
          ))}

          <button
            onClick={addSurveyQuestion}
            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-400 transition-all"
          >
            ＋ 新しい質問を追加する
          </button>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={saveDisabled}
            colorClass={`${saveDisabled ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} py-2 px-6 text-sm shadow-sm font-bold`}
          >
            {isSaving ? '保存中...' : '保存する'}
          </Button>
        </div>
      </fieldset>

    </div>
  );
};
