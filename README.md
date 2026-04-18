# TaskReward — タスク型報酬SaaS

## 概要
動画視聴＋行動（登録・申込）で報酬を獲得できる業務委託型プラットフォーム。

## 技術スタック
- **フロントエンド**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **バックエンド**: Next.js API Routes
- **DB**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **デザイン**: Notion風デザインシステム

---

## セットアップ手順

### 1. Supabaseプロジェクト作成
1. https://supabase.com でプロジェクト作成
2. `supabase/migrations/001_initial_schema.sql` を SQL Editor で実行
3. `supabase/migrations/002_seed_campaigns.sql` を実行

### 2. 環境変数設定
```bash
cp .env.local.example .env.local
```
`.env.local` に以下を設定:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. 依存関係インストール
```bash
npm install
```

### 4. 開発サーバー起動
```bash
npm run dev
```
http://localhost:3000 でアクセス

---

## 画面一覧

| パス | 説明 |
|------|------|
| `/` | LP（ランディングページ） |
| `/login` | ログイン |
| `/signup` | 新規登録 |
| `/dashboard` | ダッシュボード（収益概要・AI推薦案件） |
| `/campaigns` | 案件一覧（カテゴリ・ソート対応） |
| `/campaigns/[id]` | ミッションフロー（動画→クイズ→CTA） |
| `/earnings` | 収益レポート（日別・月別グラフ） |
| `/ranking` | リアルタイムランキング |
| `/referral` | 紹介プログラム |
| `/withdraw` | 出金申請 |
| `/terms` | 利用規約・業務委託契約 |
| `/privacy` | プライバシーポリシー |

---

## API一覧

| エンドポイント | メソッド | 説明 |
|---|---|---|
| `/api/missions/complete` | POST | ミッション完了・報酬付与 |
| `/api/withdraw` | POST | 出金申請 |
| `/api/fraud-check` | POST | 不正検知ログ |

---

## 収益ロジック

```
ASP報酬（広告主 → 運営）: 100%
ユーザー還元率: 50%
運営利益: 50%

例) 楽天カード案件
  ASP報酬: ¥16,000
  ユーザー報酬: ¥8,000
  運営利益: ¥8,000
```

### リファラルボーナス
- 1段階目: 被紹介者報酬の10%
- 2段階目: 孫紹介報酬の5%

---

## 不正対策

1. **IP制限**: 同一IPから24時間以内に3アカウント以上 → 不正フラグ
2. **デバイスフィンガープリント**: UA+画面解像度+タイムゾーンのハッシュ
3. **視聴完了判定**: 必要秒数（80%）以上の視聴必須。スキップ不可
4. **BOT検知**: 同一IPから5分以内に10回以上 → ブロック
5. **レート制限**: 同一ユーザーの同一アクション24時間100回超 → フラグ
6. **デイリーリミット**: 案件ごとに1日最大完了数を設定

---

## ランクシステム

| ランク | 必要累計報酬 | 解放特典 |
|--------|-------------|----------|
| 初心者 | ¥0〜 | 基本案件 |
| ブロンズ | ¥1,000〜 | 保険・銀行案件 |
| シルバー | ¥5,000〜 | FX口座開設案件 |
| ゴールド | ¥20,000〜 | 高単価限定案件 |
| プラチナ | ¥50,000〜 | 直広告主案件 |
| ダイヤモンド | ¥100,000〜 | 全案件解放＋専属サポート |

---

## Vercelデプロイ

```bash
# 1. GitHubにプッシュ
git init && git add . && git commit -m "initial"
git remote add origin https://github.com/your/repo.git
git push -u origin main

# 2. Vercelでインポート
# https://vercel.com/new でGitHubリポジトリを選択
# 環境変数を設定してDeployボタンをクリック
```

---

## 法律対応
- 資金決済法: ポイントではなく「業務委託報酬」として設計
- 景品表示法: 不当な表示・比較広告を禁止
- 個人情報保護法: プライバシーポリシー制定・適切な管理
- 所得税法: 支払調書発行（年50万円超）
