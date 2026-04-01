import { Link, useLocation, Outlet } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';

export const AdminSettingsLayout = () => {
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
        
        {/* 左サイドバー（スマホ時は上部の横スクロールタブに変化） */}
        <div className="w-full md:w-64 shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          {/* 変更点1: スマホ時は flex-row と overflow-x-auto で横スクロールさせる */}
          <nav className="flex flex-row md:flex-col overflow-x-auto custom-scrollbar">
            {menuItems.map(item => (
              <Link
                key={item.id}
                to={item.path}
                // 変更点2: whitespace-nowrap で文字の改行を防ぎ、shrink-0 で要素が潰れないようにする
                className={`
                  whitespace-nowrap shrink-0 text-center md:text-left px-4 md:px-6 py-3 md:py-4 font-bold transition-colors
                  /* スマホ用のデザイン（下線）と、PC用のデザイン（左線）をブレイクポイント(md:)で切り替え */
                  ${isActive(item.id) 
                    ? 'bg-blue-50 text-blue-700 border-b-4 border-blue-600 md:border-b md:border-slate-100 md:border-l-4' 
                    : 'text-slate-600 hover:bg-slate-50 border-b-4 border-transparent md:border-b md:border-slate-100 md:border-l-4'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* 右メインコンテンツ */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 min-h-125">
          <Outlet />
        </div>
      </div>
    </AdminLayout>
  );
};