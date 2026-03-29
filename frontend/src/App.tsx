import { BrowserRouter, Routes, Route, } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BookingWizard } from './pages/BookingWizard'; // 👈 追加
import { BookingSearch } from './pages/BookingSearch'; // 👈 新しく追加
import { AdminCalendar } from './pages/AdminCalendar'; // 👈 追加
import { AdminSearch } from './pages/AdminSearch'; // 👈 追加

// ==========================================
// アプリの骨組み（ルーティング設定）
// ==========================================
function App() {
  return (
    // BrowserRouterで全体を囲むことで、URLの監視が始まります
    <BrowserRouter>
      {/* Routesを2つに分け、お客様用URLと管理者用URLでレイアウトを切り替える構成に変更することも可能ですが、
          今回はシンプルに直接ルートを追加します */}
      <Routes>
        {/* お客様向け画面 */}
        <Route path="/" element={
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="grow"><BookingWizard /></main>
            <Footer />
          </div>
        } />
        <Route path="/search" element={
          <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="grow"><BookingSearch /></main>
            <Footer />
          </div>
        } />

        {/* 管理者向け画面（AdminLayout側でヘッダー等を持っているため、そのまま表示） */}
        <Route path="/admin/calendar" element={<AdminCalendar />} />
        {/* 今後ここに追加していきます： <Route path="/admin/search" element={<AdminSearch />} /> */}
        <Route path="/admin/search" element={<AdminSearch />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;