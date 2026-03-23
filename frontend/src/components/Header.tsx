import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    // 1. 白背景、下線の境界、そしてスクロールしても上部に追従する sticky を追加
    <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* ロゴ部分：少し色をつけ、文字間隔（tracking-tight）を詰めてロゴっぽく */}
        <Link 
          to="/" 
          className="text-2xl font-extrabold text-blue-700 tracking-tight hover:opacity-80 transition duration-200"
        >
          Pure-Book <span className="text-gray-800 text-lg font-bold ml-1">予約システム</span>
        </Link>

        {/* ナビゲーションメニュー */}
        <nav>
          <ul className="flex items-center space-x-4 font-medium text-gray-600">
            <li>
              {/* 2. ホバー時に薄いグレーの丸い背景が出る「ゴーストボタン」スタイル */}
              <Link 
                to="/" 
                className="px-4 py-2 rounded-full hover:bg-gray-100 hover:text-gray-900 transition duration-200 font-bold"
              >
                ホーム
              </Link>
            </li>
            <li>
              {/* 3. 重要なアクションは、ヘッダー内でもしっかりとしたボタン風に */}
              <Link 
                to="/search" 
                className="px-5 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md transition-all duration-200 font-bold"
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