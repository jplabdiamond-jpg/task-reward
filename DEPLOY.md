# TaskReward — GitHub公開 & Vercelデプロイ手順

**5分で公開完了する手順書**

コード側の準備は完了済み:
- ✅ 全Supabaseクエリを `tr_*` プレフィックスにリネーム済
- ✅ DB本番適用済（jjfddcngrewyxfycffrg, テーブル17本 + seed）
- ✅ `.gitignore` で `.env` 除外済
- ✅ `package.json` / `next.config.mjs` 設定済

残作業はユーザーのローカルMacでのコマンド実行のみ。

---

## STEP 0. 残骸クリーンアップ（一度だけ）

Cowork側で作成された不完全な `.git/` を削除します（ターミナルで1回だけ実行）:

```bash
cd "/Users/okisaneatsu/Documents/Claude/Projects/Paid-to-missonモデルSaaS/task-reward"
sudo rm -rf .git
```

---

## STEP 1. Git 初期化 & 初回コミット

```bash
cd "/Users/okisaneatsu/Documents/Claude/Projects/Paid-to-missonモデルSaaS/task-reward"

git init
git branch -M main
git config user.email "jp.lab.diamond@gmail.com"
git config user.name "さね"

git add -A
git commit -m "initial: TaskReward SaaS (Next.js 15 + Supabase + 業務委託型動画タスク報酬SaaS)"
```

---

## STEP 2. GitHub リポジトリ作成 & push

### 方法A: `gh` CLI を使う場合（推奨・最速）

```bash
# gh がまだなら
brew install gh
gh auth login   # GitHubアカウントでブラウザ認証

# 本体コマンド
cd "/Users/okisaneatsu/Documents/Claude/Projects/Paid-to-missonモデルSaaS/task-reward"
gh repo create task-reward --public --source=. --remote=origin --push
```

これだけで https://github.com/<your-user>/task-reward が公開されます。

### 方法B: ブラウザでリポジトリ作成する場合

1. https://github.com/new にアクセス
2. Repository name: `task-reward`
3. Public を選択 → **Create repository**（README/`.gitignore`/License は全てなし）
4. 以下を実行:

```bash
cd "/Users/okisaneatsu/Documents/Claude/Projects/Paid-to-missonモデルSaaS/task-reward"
git remote add origin https://github.com/<your-user>/task-reward.git
git push -u origin main
```

---

## STEP 3. Vercel デプロイ

### 方法A: `vercel` CLI を使う場合

```bash
npm i -g vercel
cd "/Users/okisaneatsu/Documents/Claude/Projects/Paid-to-missonモデルSaaS/task-reward"
vercel login    # GitHubで認証
vercel          # 初回セットアップ（Link existing/ Create new を選択）
vercel --prod   # 本番デプロイ
```

### 方法B: Vercelダッシュボードから

1. https://vercel.com/new にアクセス
2. `task-reward` リポジトリを **Import**
3. Framework preset: **Next.js**（自動検出される）
4. Environment Variables を登録（下記 STEP 4 参照）
5. **Deploy** クリック

---

## STEP 4. Vercel 環境変数設定（必須）

**専用Supabaseプロジェクト**: `wrwowezsstkqjgkkqbtm` (task-reward, ap-northeast-1)
- Dashboard: https://supabase.com/dashboard/project/wrwowezsstkqjgkkqbtm
- 他プロジェクト（jjfddcngrewyxfycffrg）とは**完全分離**

Vercel Project Settings → Environment Variables で以下を設定:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wrwowezsstkqjgkkqbtm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indyd293ZXpzc3RrcWpna2txYnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTQ4OTQsImV4cCI6MjA5MjA3MDg5NH0.qdOGogMMAwdfQUwvQYlUAE86vUuOoD6zhb7qwsgGqdg` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API から取得（**Sensitive/Encrypted**チェック必須） |
| `NEXT_PUBLIC_APP_URL` | `https://<your-project>.vercel.app` |

**注意**:
- `SUPABASE_SERVICE_ROLE_KEY` は必ず **Sensitive / Encrypted** チェックを入れる
- Stripe 関連は MVP では未使用のためスキップ可
- 設定後 **Redeploy** を忘れずに

---

## STEP 5. Supabase Auth 設定

Supabaseダッシュボード ( https://supabase.com/dashboard/project/wrwowezsstkqjgkkqbtm ) で:

### 5-1. Site URL
- Authentication > URL Configuration > **Site URL** に Vercel本番URLを設定
- 例: `https://task-reward-xxx.vercel.app`

### 5-2. Redirect URLs
Additional Redirect URLs に追加:
- `https://task-reward-xxx.vercel.app/**`
- `http://localhost:3000/**`（ローカル開発用）

### 5-3. Email認証（MVP用簡易設定）
- Authentication > Providers > Email > **Confirm email** を OFF（デモ簡便化）
- 本番では必ず ON に戻す

---

## STEP 6. 動作確認

1. Vercelの公開URLにアクセス → LPが表示される
2. `/signup` で新規登録（メアド＋パスワード）
3. `/dashboard` にリダイレクトされる
4. `/campaigns` で案件一覧（7件表示）
5. 任意の案件で動画視聴 → クイズ → CTAを通過確認

---

## トラブルシューティング

| 症状 | 原因 | 対処 |
|------|------|------|
| Vercelで500エラー | 環境変数未設定 | STEP 4で全4つ設定し Redeploy |
| ログイン後に空白 | Site URL 不一致 | STEP 5-1 を確認 |
| `relation "tr_users" does not exist` | DB未適用 | `DESIGN.md §11` のmigration再実行 |
| クイズが進まない | RLS | Supabase > Auth > User を作成確認 |
| `Missing environment variable NEXT_PUBLIC_SUPABASE_URL` | `.env.local` がgit commit されている可能性 | `.gitignore` 確認、該当commit削除 |

---

## 本番運用に向けた追加設定

- Supabase Email Auth → Confirm email を ON
- Vercel > Domains で独自ドメイン設定
- Stripe Connect で出金API連結
- ASP Webhook の Postback URL を `https://<domain>/api/webhooks/asp/a8?tid={TID}&amount={REWARD}` に設定
- Sentry / LogSnag で本番エラー監視
- Rate Limit（Upstash Redis）

---

## 参考: プロジェクト構成

```
task-reward/
├── app/                    # Next.js App Router
│   ├── (auth)/             # ログイン/登録
│   ├── (dashboard)/        # 認証後ページ
│   ├── api/                # Route Handlers
│   ├── terms/privacy/      # 規約
│   └── page.tsx            # LP
├── components/             # UIコンポーネント
├── lib/supabase/           # Supabaseクライアント
├── supabase/migrations/    # DBスキーマ
├── middleware.ts           # 認証ミドルウェア
├── DESIGN.md               # 全体設計書
├── UI_DESIGN.html          # UIプレビュー
└── DEPLOY.md               # 本ファイル
```
