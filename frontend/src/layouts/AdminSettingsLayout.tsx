import { Link, useLocation, Outlet } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';

export const AdminSettingsLayout = () => {
  // 現在のURLを取得
  const location = useLocation();
  const isActive = (path: string) => location.pathname.includes(path);

  const menuItems = [
    { id: 'hours', path: '/admin/settings/hours', label: '営業時間・休業日設定' },
    { id: 'period', path: '/admin/settings/period', label: '予約受付期間の設定' },
    { id: 'survey', path: '/admin/settings/survey', label: '予約時アンケート設定' },
    { id: 'terms', path: '/admin/settings/terms', label: '規約設定' },
    { id: 'menus', path: '/admin/settings/menus', label: 'メニュー登録' },
    { id: 'staff', path: '/admin/settings/staff', label: 'スタッフ登録' },
    { id: 'resource', path: '/admin/settings/resource', label: 'リソース管理（シフト）' },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row gap-6 relative">
        
        {/* 左サイドバー */}
        <div className="w-full md:w-64 shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <nav className="flex flex-col">
            {menuItems.map(item => (
              <Link
                key={item.id}
                to={item.path}
                // URLが一致しているか判定して色を変える
                className={`text-left px-6 py-4 border-b border-slate-100 font-bold transition-colors ${
                  isActive(item.id) ? 'bg-blue-50 text-blue-700 border-l-4 border-l-blue-600' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* 右メインコンテンツ */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 min-h-125">
          {/* ▼ ここが魔法のタグ。URLに応じて、子コンポーネントがここにスポッと入ります ▼ */}
          <Outlet />
        </div>
      </div>
    </AdminLayout>
  );
};