import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Button } from './components/Button';
import { Input } from './components/Input';

// ==========================================
// 仮のページコンポーネント（後のカードで別ファイルに分けます）
// ==========================================

// トップページ（/）
const HomePage = () => (
  <div className="p-8 text-center">
    <h2 className="text-2xl font-bold mb-4">ご予約はこちらから</h2>
    <p className="mb-8 text-gray-600">希望のメニューとスタッフを選択してください。</p>
    {/* Linkコンポーネントを使うと、画面を白くせずに（高速に）URLだけを書き換えます */}
    <Link to="/search">
      <Button colorClass="bg-green-600 hover:bg-green-700">予約を検索・キャンセルする</Button>
    </Link>
  </div>
);

// 検索ページ（/search）
const SearchPage = () => (
  <div className="p-8 max-w-md mx-auto">
    <h2 className="text-2xl font-bold mb-6 text-center">予約の確認</h2>
    {/* 先ほど作った共通Input部品のテスト配置 */}
    <Input 
      label="予約番号" 
      value="" 
      onChange={() => {}} 
      placeholder="例: BKG-XXXXXXXX" 
    />
    <Input 
      label="メールアドレス" 
      type="email" 
      value="" 
      onChange={() => {}} 
      placeholder="例: test@example.com" 
    />
    <div className="mt-6 flex justify-between">
      <Link to="/">
        <Button colorClass="bg-gray-500 hover:bg-gray-600">戻る</Button>
      </Link>
      <Button>検索する</Button>
    </div>
  </div>
);

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
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </main>

        <Footer /> {/* どのURLでも必ず表示される共通フッター */}

      </div>
    </BrowserRouter>
  );
}

export default App;