import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

// 子要素（中身のページ）を受け取るための型の定義
interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  // 現在のURLを取得して、ナビゲーションのハイライトに使う
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    // 管理者画面は全体的に少しカッチリした色合い（slate系）にします
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* 一緒にスクロールして消えるヘッダー（あえて fixed 等を使わない） */}
      <header className="bg-slate-900 text-white shadow-md">
        {/* 変更点1: h-16 を sm:h-16 に変更し、スマホ時は flex-col で縦並びに。 */}
        <div className="container mx-auto px-4 sm:h-16 flex flex-col sm:flex-row items-center justify-between">
          
          {/* 変更点2: スマホ時は上に少し余白（py-3 sm:py-0）を持たせる */}
          <h1 className="text-xl font-bold tracking-widest text-slate-100 py-3 sm:py-0">
            Pure-Book <span className="text-sm font-normal text-slate-400 ml-2">予約管理システム</span>
          </h1>
          
          {/* 変更点3: w-full と justify-center でスマホ時は中央に配置。間隔も少し狭める(space-x-4) */}
          <nav className="flex space-x-4 sm:space-x-8 w-full sm:w-auto justify-center sm:justify-end overflow-x-auto">
            <Link 
              to="/admin/calendar" 
              className={`hover:text-blue-300 transition-colors py-3 sm:py-5 border-b-2 whitespace-nowrap text-sm sm:text-base ${isActive('/admin/calendar') ? 'border-blue-400 text-blue-400 font-bold' : 'border-transparent text-slate-300'}`}
            >
              カレンダー
            </Link>
            <Link 
              to="/admin/search" 
              className={`hover:text-blue-300 transition-colors py-3 sm:py-5 border-b-2 whitespace-nowrap text-sm sm:text-base ${isActive('/admin/search') ? 'border-blue-400 text-blue-400 font-bold' : 'border-transparent text-slate-300'}`}
            >
              予約検索
            </Link>
            <Link 
              to="/admin/settings" 
              className={`hover:text-blue-300 transition-colors py-3 sm:py-5 border-b-2 whitespace-nowrap text-sm sm:text-base ${isActive('/admin/settings') ? 'border-blue-400 text-blue-400 font-bold' : 'border-transparent text-slate-300'}`}
            >
              各種設定
            </Link>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ（各ページのUIがこの children の部分にスポッと入ります） */}
      <main className="p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      
    </div>
  );
};