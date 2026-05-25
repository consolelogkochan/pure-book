import { useStaffSettings } from '../../../hooks/useStaffSettings';
import { StaffFormModal } from '../../../components/admin/StaffFormModal';
import { Button } from '../../../components/Button';

export const StaffSettings = () => {
  const {
    staffs, isLoading, isSaving, fetchFailed,
    message, messageType,
    confirmingStaff, isModalOpen, editingStaff,
    fetchStaffs, openModal, closeModal,
    requestToggle, cancelToggle, confirmToggle,
  } = useStaffSettings();

  if (isLoading) return <div className="p-4 text-slate-500">読み込み中...</div>;

  return (
    <div className="space-y-6 animate-fade-in relative">

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-2 gap-4 sm:gap-0">
        <h2 className="text-xl font-bold text-slate-800">スタッフ登録</h2>
        <Button
          onClick={() => openModal()}
          disabled={fetchFailed}
          colorClass={`${fetchFailed ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} py-2 px-4 text-sm w-full sm:w-auto`}
        >
          ＋ 新規スタッフ追加
        </Button>
      </div>

      <div className="overflow-x-auto pb-2">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-150">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-3 font-bold text-sm text-slate-600">状態</th>
              <th className="p-3 font-bold text-sm text-slate-600">スタッフ名</th>
              <th className="p-3 font-bold text-sm text-slate-600">役職・ラベル</th>
              <th className="p-3 font-bold text-sm text-slate-600 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staffs.map(staff => (
              <tr key={staff.id} className={`hover:bg-slate-50 transition-colors ${!staff.is_active ? 'opacity-50 bg-slate-50' : ''}`}>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    staff.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {staff.is_active ? '稼働中' : '停止中'}
                  </span>
                </td>
                <td className="p-3 font-bold text-slate-800">{staff.name}</td>
                <td className="p-3 text-slate-600">
                  {staff.role ? (
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs">{staff.role}</span>
                  ) : (
                    <span className="text-slate-400 text-xs">未設定</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  {confirmingStaff?.id === staff.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-slate-600 font-medium">本当に変更しますか？</span>
                      <button
                        onClick={cancelToggle}
                        disabled={isSaving}
                        className="text-sm border border-slate-300 px-3 py-1 rounded hover:bg-slate-100 font-bold"
                      >
                        いいえ
                      </button>
                      <button
                        onClick={confirmToggle}
                        disabled={isSaving}
                        className={`text-sm border px-3 py-1 rounded font-bold text-white transition ${
                          isSaving ? 'bg-gray-400 border-gray-400' : 'bg-blue-600 border-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isSaving ? '変更中...' : 'はい'}
                      </button>
                    </div>
                  ) : (
                    // Issue 3: 確認UI表示中は他行のボタンを無効化して操作の混在を防ぐ
                    <div className="space-x-2">
                      <button
                        onClick={() => openModal(staff)}
                        disabled={confirmingStaff !== null}
                        className="text-sm border border-slate-300 px-3 py-1 rounded hover:bg-slate-100 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => requestToggle(staff)}
                        disabled={confirmingStaff !== null}
                        className={`text-sm border px-3 py-1 rounded font-bold disabled:opacity-40 disabled:cursor-not-allowed ${
                          staff.is_active
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {staff.is_active ? '稼働停止にする' : '稼働再開する'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {staffs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-500">
                  スタッフが登録されていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <StaffFormModal
        isOpen={isModalOpen}
        editingStaff={editingStaff}
        onSuccess={() => fetchStaffs().catch(() => {})}
        onClose={closeModal}
      />
    </div>
  );
};
