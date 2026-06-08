# Pure-Book — 美容室向け予約管理システム

<p>
  <a href="https://github.com/consolelogkochan/pure-book/actions/workflows/quality.yml">
    <img src="https://github.com/consolelogkochan/pure-book/actions/workflows/quality.yml/badge.svg" alt="Code Quality">
  </a>
  <img src="https://img.shields.io/badge/PHPStan-Level%206-brightgreen" alt="PHPStan Level 6">
  <img src="https://img.shields.io/badge/PHP-8.4-777BB4?logo=php" alt="PHP 8.4">
  <img src="https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel" alt="Laravel 12">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript">
</p>

## コンセプト

**「止まらない、間違えない、待たせない。」**

「動く」を作ることから「動作を保証する」ことへ。  
排他制御・スケジュール計算・Resilient UX の3つを技術的挑戦として設定し、  
実装 → テスト → バグ発見 → 修正のサイクルを意識して開発した予約プラットフォームです。

---

## 技術スタック

| 領域 | 技術 |
|------|------|
| Backend | Laravel 12 (API モード), PHP 8.4 |
| Frontend | React 19, TypeScript, Vite |
| Database | MySQL 8.4 |
| Queue | Redis |
| Mail | Resend |
| 静的解析 | PHPStan Level 6 (Larastan) |
| Backend Test | PHPUnit — Unit / Feature |
| Frontend Test | Vitest + React Testing Library |
| 負荷テスト | k6 |
| CI | GitHub Actions |
| 開発環境 | Laravel Sail (Docker) |

---

## 技術的な挑戦

### 1. 排他制御 — ダブルブッキングを 0 件にする

**課題:** 同一スロットへの同時リクエストで重複予約が発生する。

**実装:** `DB::transaction()` 内で `lockForUpdate()` を使い、スタッフ行を悲観的ロックで取得。トランザクション外からの呼び出しは `LogicException` で即時拒否し、コードレベルで誤用を防止。

```php
// トランザクション外からの呼び出しをコードで強制的に禁止する
public function getAvailableStaffs(string $dayOfWeek, ?int $requestedStaffId = null): Collection
{
    if (DB::transactionLevel() === 0) {
        throw new \LogicException('getAvailableStaffs() must be called within a DB transaction.');
    }
    return Staff::where('is_active', true)
        ->whereHas('schedule', fn($q) => $q->where($dayOfWeek, true))
        ->lockForUpdate()
        ->get();
}
```

**負荷テストで発見したバグと修正:**

スタッフ取得に `lockForUpdate()` を実装した後、k6 で 10 VU 同時リクエストを送ったところ **201 が 5 件返り、DB に重複予約が 5 件作成された。**

原因は MySQL REPEATABLE READ のスナップショット読み取り。スタッフロックで直列化できていたが、後続の重複チェッククエリ（通常の `SELECT`）がトランザクション開始時点のスナップショットを読むため、別トランザクションのコミット済み予約が見えなかった。

```php
// 修正: 重複チェッククエリにも lockForUpdate() を追加し、常に最新データを読む
return Booking::whereIn('staff_id', $staffIds)
    ->where('status', '!=', 'cancelled')
    ->where(fn($q) => $q->where('start_time', '<', $endTime)->where('end_time', '>', $startTime))
    ->lockForUpdate() // ← 追加
    ->get();
```

修正後: **201 × 1 件 / 409 × 9 件** で全 THRESHOLD パス。

---

### 2. 複合スケジュール計算 — N+1 を出さない空き枠算出

**課題:** スタッフシフト・メニュー所要時間・既存予約を組み合わせた空き枠計算は、実装が複雑になるほどクエリが膨らみやすい。

**実装:** 計算ロジックをすべてバックエンドに集約。関連モデルは全箇所で `with()` によるEager Loadingを統一し、クエリ回数を一定に抑えた。

```php
// 予約一覧取得: bookings × 1 + menus × 1 + staff × 1 = 計 3 クエリで完結
Booking::with(['menu', 'staff'])->get();
```

CSV 出力は件数が膨大になり得るため `lazy(500)` でチャンク処理し、メモリ安全性を確保。

```php
// lazy(500): 500件ずつ取得し with() のEager Loadingもチャンク単位で実行
// cursor() + with() は全関連モデルをメモリに保持するため大量データに不向き
Booking::with(['menu', 'staff'])->lazy(500);
```

---

### 3. Resilient UX — 失敗を想定した設計

**冪等性:** 予約番号（`booking_reference`）の生成は `exists()` チェック後 `INSERT` の2段階ではなく、UNIQUE 制約違反を直接キャッチしてリトライする。確認と挿入の間に別トランザクションが割り込む TOCTOU 競合を排除。

```php
for ($i = 0; $i < 5; $i++) {
    try {
        $data['booking_reference'] = 'BKG-' . strtoupper(Str::random(8));
        return Booking::create($data);
    } catch (UniqueConstraintViolationException) {
        // 衝突時のみリトライ
    }
}
```

**エラーハンドリング:** 「不明なエラー」を返さず、状況に応じたステータスコードと次のアクションを示すメッセージを返す。

| ステータス | シナリオ | メッセージ |
|-----------|---------|-----------|
| `409` | タッチの差で枠が埋まった | 「タッチの差で予約が埋まってしまいました。」 |
| `403` | キャンセル期限切れ | 「キャンセル期限を過ぎているため、店舗へ直接お電話ください。」 |
| `400` | 既にキャンセル済み | 「この予約はすでにキャンセルされています。」 |
| `404` | 本人確認失敗 | 「予約が見つからないか、認証に失敗しました。」 |

**フロントエンドの二重送信防止:** 送信中はボタン単体ではなく `<fieldset disabled>` でフォーム全体を無効化し、あらゆる入力操作を受け付けない。ボタンのラベルも「予約処理中...」に切り替え、ユーザーへの状態フィードバックを明示。

```tsx
// ボタンだけでなくフォーム全体を無効化することで、送信中の誤操作を完全に防ぐ
<fieldset disabled={isSubmitting} className="border-0 p-0 m-0 space-y-4">
  {/* ... フォーム要素 ... */}
  <button type="submit" disabled={isSubmitting}>
    {isSubmitting ? '予約処理中...' : 'この内容で予約を確定する'}
  </button>
</fieldset>
```

**初回データ取得失敗時の操作防止:** 管理者カレンダーは `isLoading` 中はカレンダー本体を描画しない。データ未取得の状態で操作できてしまうことを防ぐ。

**障害の局所化:** 管理者カレンダーのデータ取得は `Promise.allSettled()` を使用。メニュー取得が失敗してもカレンダー表示は止まらない。

---

## システム構成

```
┌─────────────────────────────────────────────────────────┐
│  顧客画面 (React)          管理者画面 (React)              │
│  BookingWizard             AdminCalendar / AdminSearch    │
│  BookingSearch             Settings (各種設定)             │
└──────────────┬──────────────────────┬────────────────────┘
               │ REST API             │ REST API (要認証)
┌──────────────▼──────────────────────▼────────────────────┐
│  Laravel 12 (API モード)                                  │
│  BookingController    AdminBookingController              │
│         └──────────── BookingService ──────────┘         │
│                    AvailableSlotController                │
└────────────┬────────────────────────────┬────────────────┘
             │                            │
        ┌────▼─────┐               ┌──────▼──────┐
        │  MySQL   │               │    Redis    │
        │ (予約DB) │               │ (Mail Queue)│
        └──────────┘               └─────────────┘
```

---

## テスト構成

| 種別 | 対象 | 件数 |
|------|------|------|
| PHPUnit Unit | BookingService（ロック・スロット計算・重複検出） | 31 件 |
| PHPUnit Feature | BookingController API（正常系・異常系・認証） | (上記に含む) |
| Vitest Unit | bookingHelpers 純粋関数 | 154 件中一部 |
| Vitest Integration | useBooking / useAdminSearch 等フック 4 本 | 〃 |
| Vitest Component | SearchForm / CancelModal 等コンポーネント 8 本 | 〃 |
| k6 負荷テスト | 10 VU 同時予約（排他制御の実証） | 201×1 / 409×9 |

---

## ローカルセットアップ

```bash
# 1. リポジトリを取得
git clone https://github.com/consolelogkochan/pure-book.git
cd pure-book

# 2. 環境変数を設定
cp .env.example .env

# 3. 依存パッケージをインストール
docker run --rm -v $(pwd):/app composer install

# 4. コンテナを起動
./vendor/bin/sail up -d

# 5. アプリケーションキーを生成・マイグレーション・シーダー実行
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed

# 6. フロントエンドの依存パッケージをインストール・ビルド
./vendor/bin/sail npm install
./vendor/bin/sail npm run dev
```

アプリケーション: http://localhost  
管理者画面: http://localhost/admin/login

---

## テスト実行

```bash
# Backend (PHPUnit)
./vendor/bin/sail artisan test

# Frontend (Vitest)
./vendor/bin/sail npm run test

# 静的解析 (PHPStan Level 6)
./vendor/bin/sail php ./vendor/bin/phpstan analyse

# 負荷テスト (k6 / ローカル起動中に実行)
k6 run tests/k6/concurrent_booking_test.js
```
