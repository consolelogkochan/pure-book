import { Link, useLocation } from 'react-router-dom';

export const Header = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-slate-900 text-white shadow-md">
      <div className="container mx-auto px-4 sm:h-16 flex flex-col sm:flex-row items-center justify-between">

        <Link
          to="/"
          className="text-xl font-bold tracking-widest text-slate-100 py-3 sm:py-0 hover:opacity-80 transition duration-200"
        >
          Pure-Book <span className="text-sm font-normal text-slate-400 ml-2">予約システム</span>
        </Link>

        <nav className="flex items-center space-x-4 sm:space-x-8 w-full sm:w-auto justify-center sm:justify-end overflow-x-auto">
          <Link
            to="/"
            className={`hover:text-blue-300 transition-colors py-3 sm:py-5 border-b-2 whitespace-nowrap text-sm sm:text-base ${isActive('/') ? 'border-blue-400 text-blue-400 font-bold' : 'border-transparent text-slate-300'}`}
          >
            ホーム
          </Link>
          <Link
            to="/search"
            className={`hover:text-blue-300 transition-colors py-3 sm:py-5 border-b-2 whitespace-nowrap text-sm sm:text-base ${isActive('/search') ? 'border-blue-400 text-blue-400 font-bold' : 'border-transparent text-slate-300'}`}
          >
            予約確認・キャンセル
          </Link>
        </nav>

      </div>
    </header>
  );
};