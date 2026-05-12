export const CancelCompleteView = () => {
  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow-sm mt-8 text-center">
      <div className="text-gray-400 text-5xl mb-4">✅</div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">ご予約のキャンセルを承りました。</h2>
      <p className="mb-6 text-gray-600">またのご利用を心よりお待ちしております。</p>
      <button
        onClick={() => window.location.reload()}
        className="text-blue-600 hover:underline"
      >
        トップページへ戻る
      </button>
    </div>
  );
};
