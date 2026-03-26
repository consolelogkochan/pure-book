import { BrowserRouter, Routes, Route, } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BookingWizard } from './pages/BookingWizard'; // 👈 追加
import { BookingSearch } from './pages/BookingSearch'; // 👈 新しく追加


// ==========================================
// アプリの骨組み（ルーティング設定）
// ==========================================
function App() {
  return (
    // BrowserRouterで全体を囲むことで、URLの監視が始まります
    <BrowserRouter>
      {/* 画面全体を縦並び(flex-col)にし、最低でも画面の高さ(min-h-screen)を確保 */}
      <div className="flex flex-col min-h-screen bg-gray-50">
        
        <Header /> {/* どのURLでも必ず表示される共通ヘッダー */}

        {/* メインコンテンツ部分（growで余った余白を全て埋める＝Footerを一番下に押しやる） */}
        <main className="grow">
          {/* URLとDOMの紐づけ設定 */}
          <Routes>
            <Route path="/" element={<BookingWizard />} />
            <Route path="/search" element={<BookingSearch />} />
          </Routes>
        </main>

        <Footer /> {/* どのURLでも必ず表示される共通フッター */}

      </div>
    </BrowserRouter>
  );
}

export default App;