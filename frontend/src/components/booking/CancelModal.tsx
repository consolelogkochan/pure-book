interface Props {
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const CancelModal = ({ onConfirm, onClose }: Props) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-all flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full shadow-xl">
        <h3 className="text-lg font-bold text-red-600 mb-2">本当によろしいですか？</h3>
        <p className="text-gray-600 mb-6 text-sm">
          一度キャンセルすると元に戻すことはできません。この予約を取り消しますか？
        </p>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-200 text-gray-800 rounded font-bold hover:bg-gray-300 transition"
          >
            やめる
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition"
          >
            キャンセル確定
          </button>
        </div>
      </div>
    </div>
  );
};
