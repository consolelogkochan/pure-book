import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BookingWizard } from './pages/BookingWizard'; // 👈 追加
import { BookingSearch } from './pages/BookingSearch'; // 👈 新しく追加
import { AdminCalendar } from './pages/AdminCalendar'; // 👈 追加
import { AdminSearch } from './pages/AdminSearch'; // 👈 追加
import { AdminSettingsLayout } from './layouts/AdminSettingsLayout';
import { HoursSettings } from './pages/admin/settings/HoursSettings';
import { PeriodSettings } from './pages/admin/settings/PeriodSettings';
import { SurveySettings } from './pages/admin/settings/SurveySettings';
import { MenusSettings } from './pages/admin/settings/MenusSettings';
import { StaffSettings } from './pages/admin/settings/StaffSettings';
import { ResourceSettings } from './pages/admin/settings/ResourceSettings';
import AdminLogin from './pages/admin/Login';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// ==========================================
// アプリの骨組み（ルーティング設定）
// ==========================================
function App() {
  return (
    // BrowserRouterで全体を囲むことで、URLの監視が始まります
    <BrowserRouter>
      <AuthProvider>
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

          {/* 管理者ログイン画面 */}
          <Route path="/admin/login" element={<AdminLogin />} />
          {/* 管理者向け画面を ProtectedRoute で囲む ▼ */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/calendar" element={<AdminCalendar />} />
            <Route path="/admin/search" element={<AdminSearch />} />
            {/* ▼ ここからネストされたルーティングに変更 ▼ */}
            <Route path="/admin/settings" element={<AdminSettingsLayout />}>
              {/* /admin/settings にアクセスされたら、自動的に /hours に飛ばす設定 */}
              <Route index element={<Navigate to="hours" replace />} />
              
              {/* 子ルートたち（Outlet の部分に表示される） */}
              <Route path="hours" element={<HoursSettings />} />
              <Route path="period" element={<PeriodSettings />} />
              <Route path="survey" element={<SurveySettings />} />
              <Route path="menus" element={<MenusSettings />} />
              <Route path="staff" element={<StaffSettings />} />
              <Route path="resource" element={<ResourceSettings />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;