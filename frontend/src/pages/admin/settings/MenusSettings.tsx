import { useMenusSettings } from '../../../hooks/useMenusSettings';
import { MenuFormModal } from '../../../components/admin/MenuFormModal';
import { Button } from '../../../components/Button';

export const MenusSettings = () => {
  const {
    menus, isLoading, isSaving,
    isMenuModalOpen, editingMenu, confirmingMenu,
    message, messageType,
    fetchMenus, openModal, closeModal,
    requestToggle, confirmToggle, cancelToggle,
  } = useMenusSettings();

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
        <h2 className="text-xl font-bold text-slate-800">メニュー登録</h2>
        <Button onClick={() => openModal()} colorClass="bg-blue-600 hover:bg-blue-700 py-2 px-4 text-sm w-full sm:w-auto">
          ＋ 新規メニュー追加
        </Button>
      </div>

      <div className="overflow-x-auto pb-2">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-150">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-3 font-bold text-sm text-slate-600">状態</th>
              <th className="p-3 font-bold text-sm text-slate-600">メニュー名</th>
              <th className="p-3 font-bold text-sm text-slate-600">料金</th>
              <th className="p-3 font-bold text-sm text-slate-600">所要時間</th>
              <th className="p-3 font-bold text-sm text-slate-600 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {menus.map(menu => (
              <tr key={menu.id} className={`hover:bg-slate-50 ${!menu.is_active ? 'opacity-50 bg-slate-50' : ''}`}>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${menu.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {menu.is_active ? '公開中' : '非公開'}
                  </span>
                </td>
                <td className="p-3 font-bold text-slate-800">{menu.name}</td>
                <td className="p-3 text-slate-600">¥{menu.price.toLocaleString()}</td>
                <td className="p-3 text-slate-600">{menu.duration_minutes}分</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => openModal(menu)} className="text-sm border border-slate-300 px-3 py-1 rounded hover:bg-slate-100 font-bold">
                    編集
                  </button>
                  <button
                    onClick={() => requestToggle(menu)}
                    className={`text-sm border px-3 py-1 rounded font-bold ${
                      menu.is_active
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {menu.is_active ? '非公開にする' : '公開する'}
                  </button>
                </td>
              </tr>
            ))}
            {menus.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">メニューが登録されていません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {confirmingMenu && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">確認</h3>
            <p className="text-slate-600 mb-6 text-sm">
              「{confirmingMenu.name}」を{confirmingMenu.is_active ? '非公開' : '公開'}にしますか？
            </p>
            <div className="flex gap-4">
              <button
                onClick={cancelToggle}
                className="flex-1 py-2 bg-gray-200 text-gray-800 rounded font-bold hover:bg-gray-300 transition"
              >
                やめる
              </button>
              <button
                onClick={confirmToggle}
                disabled={isSaving}
                className={`flex-1 py-2 rounded font-bold text-white transition ${
                  isSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSaving ? '処理中...' : '確定する'}
              </button>
            </div>
          </div>
        </div>
      )}

      <MenuFormModal
        isOpen={isMenuModalOpen}
        editingMenu={editingMenu}
        onSuccess={fetchMenus}
        onClose={closeModal}
      />
    </div>
  );
};
