import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useBooking } from '../hooks/useBooking';

export const BookingWizard = () => {
  const {
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
  } = useBooking();

  const { register, handleSubmit, formState: { errors } } = form;

  if (completedBookingRef) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-sm mt-8 text-center">
        <div className="text-green-500 text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">ご予約が完了しました！</h2>
        <p className="mb-6 text-gray-600">ご登録いただいたメールアドレスに詳細をお送りしました。</p>
        <div className="bg-gray-50 p-6 rounded-lg mb-8 inline-block text-left border">
          <p className="text-sm text-gray-500 mb-1">予約照会番号</p>
          <p className="text-2xl font-mono font-bold text-blue-600 tracking-wider">{completedBookingRef}</p>
          <p className="text-xs text-red-500 mt-2">※キャンセル時に必要になります。必ずお控えください。</p>
        </div>
        <div>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:underline"
          >
            トップページへ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm mt-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">新規ご予約</h2>

      {/* Step 3 未表示時のエラーバナー（初期取得失敗・メニュー未選択など） */}
      {errorMessage && !selectedTime && (
        <div className="mb-6 p-3 rounded-lg text-sm font-medium bg-red-100 text-red-700">
          {errorMessage}
        </div>
      )}

      {/* --- Step 1: メニュー --- */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">Step 1: メニューを選ぶ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menus.map((menu) => (
            <div
              key={menu.id}
              onClick={() => handleMenuSelect(menu)}
              className={`p-4 border rounded-lg cursor-pointer transition ${
                selectedMenu?.id === menu.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="font-bold">{menu.name}</div>
              <div className="text-sm text-gray-600">¥{menu.price.toLocaleString()} / {menu.duration_minutes}分</div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Step 2: 日付と時間 --- */}
      <div className="mb-8 opacity-100 transition-opacity duration-500">
        <h3 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">Step 2: 日付と時間を選ぶ</h3>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              minDate={new Date()}
              className="border-none shadow-sm rounded-lg p-2"
            />
          </div>
          <div className="flex-1">
            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    className={`py-2 border rounded transition ${
                      selectedTime === slot ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-blue-50'
                    }`}
                    onClick={() => handleTimeSelect(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : selectedDate ? (
              <p className="text-red-500">この日は空きがありません。</p>
            ) : (
              <p className="text-gray-400 text-sm">カレンダーから日付を選択してください。</p>
            )}
          </div>
        </div>
      </div>

      {/* --- Step 3: お客様情報 --- */}
      {selectedTime && (
        <div className="mb-8 animate-fade-in-up">
          <h3 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">Step 3: お客様情報の入力</h3>

          <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-50 p-6 rounded-lg border">
            <fieldset disabled={isSubmitting} className="border-0 p-0 m-0 space-y-4">

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">お名前 <span className="text-red-500">*</span></label>
              <input
                {...register('customer_name', { required: 'お名前は必須です' })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="例: 山田 太郎"
              />
              {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
              <input
                {...register('customer_email', {
                  required: 'メールアドレスは必須です',
                  pattern: { value: /^\S+@\S+$/i, message: '正しいメールアドレス形式で入力してください' },
                })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="例: taro@example.com"
              />
              {errors.customer_email && <p className="text-red-500 text-xs mt-1">{errors.customer_email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">電話番号<span className="text-red-500">*</span></label>
              <input
                {...register('customer_phone', { required: '電話番号は必須です' })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="例: 090-1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">ご要望・メモ（任意）</label>
              <textarea
                {...register('customer_memo')}
                rows={3}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="アレルギーや、事前に伝えておきたいことなどをご記入ください"
              />
            </div>

            {surveyQuestions.length > 0 && (
              <div className="bg-white p-5 rounded border mt-6 shadow-sm">
                <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">店舗からのアンケート</h4>
                <div className="space-y-6">
                  {surveyQuestions.map(q => (
                    <div key={q.id}>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {q.question_text}
                        {q.is_required && <span className="text-red-500 ml-1">*</span>}
                        {q.type === 'checkbox' && <span className="text-xs text-gray-400 font-normal ml-2">※複数選択可</span>}
                      </label>

                      {q.type === 'text' && (
                        <input
                          type="text"
                          {...register(`survey_${q.id}` as string, { required: q.is_required ? '必須項目です' : false })}
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                          placeholder="ご自由にご記入ください"
                        />
                      )}

                      {q.type === 'radio' && (
                        <div className="flex flex-wrap gap-4">
                          {q.options.map((opt, index) => (
                            <label key={index} className="flex items-center cursor-pointer bg-slate-50 border rounded px-3 py-2 hover:bg-slate-100 transition">
                              <input
                                type="radio"
                                value={opt}
                                {...register(`survey_${q.id}` as string, { required: q.is_required ? '必須項目です' : false })}
                                className="mr-2 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {q.type === 'checkbox' && (
                        <div className="flex flex-wrap gap-4">
                          {q.options.map((opt, index) => (
                            <label key={index} className="flex items-center cursor-pointer bg-slate-50 border rounded px-3 py-2 hover:bg-slate-100 transition">
                              <input
                                type="checkbox"
                                value={opt}
                                {...register(`survey_${q.id}` as string, { required: q.is_required ? '必須項目です' : false })}
                                className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {errors[`survey_${q.id}`] && (
                        <p className="text-red-500 text-xs mt-1">{(errors[`survey_${q.id}`] as { message?: string })?.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {termsText && termsText.trim() !== '' && (
              <div className="bg-white p-5 rounded border mt-6 shadow-sm">
                <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">利用規約の確認</h4>
                <div className="bg-slate-50 border rounded p-4 h-40 overflow-y-auto mb-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {termsText}
                </div>
                <div>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      {...register('terms_accepted', { required: '予約を進めるには利用規約への同意が必要です。' })}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-3"
                    />
                    <span className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      利用規約に同意する <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {errors.terms_accepted && (
                    <p className="text-red-500 text-xs mt-2 ml-8">{errors.terms_accepted.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3 表示中のエラーバナー（送信エラーなど）— 送信ボタン直上に配置 */}
            {errorMessage && (
              <div className="p-3 rounded-lg text-sm font-medium bg-red-100 text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="pt-4 text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full md:w-auto px-8 py-3 rounded-full font-bold text-white transition-all ${
                  isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
                }`}
              >
                {isSubmitting ? '予約処理中...' : 'この内容で予約を確定する'}
              </button>
            </div>
            </fieldset>
          </form>
        </div>
      )}
    </div>
  );
};
