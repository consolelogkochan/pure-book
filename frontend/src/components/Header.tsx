import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      {/* 変更点1: スマホ時は flex-col（縦並び）で gap-3（上下の隙間）。
        sm:（画面幅640px以上）で flex-row（横並び）に戻す。
      */}
      <div className="container mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
        
        {/* ロゴ部分：スマホ時は文字を少しだけ小さくする（text-xl sm:text-2xl） */}
        <Link 
          to="/" 
          className="text-xl sm:text-2xl font-extrabold text-blue-700 tracking-tight hover:opacity-80 transition duration-200"
        >
          Pure-Book <span className="text-gray-800 text-base sm:text-lg font-bold ml-1">予約システム</span>
        </Link>

        {/* ナビゲーションメニュー */}
        <nav className="w-full sm:w-auto">
          {/* 変更点2: スマホ時は w-full と justify-center で中央に均等配置。
            文字サイズもスマホ時は text-sm にして横幅に収める。
          */}
          <ul className="flex items-center justify-center space-x-2 sm:space-x-4 font-medium text-gray-600 text-sm sm:text-base">
            <li>
              <Link 
                to="/" 
                // whitespace-nowrap で文字の意図しない改行を防ぐ
                className="px-3 sm:px-4 py-2 rounded-full hover:bg-gray-100 hover:text-gray-900 transition duration-200 font-bold whitespace-nowrap"
              >
                ホーム
              </Link>
            </li>
            <li>
              <Link 
                to="/search" 
                className="px-4 sm:px-5 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md transition-all duration-200 font-bold whitespace-nowrap"
              >
                予約確認・キャンセル
              </Link>
            </li>
          </ul>
        </nav>
        
      </div>
    </header>
  );
};