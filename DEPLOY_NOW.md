# TaskReward — Cloudflare Pages デプロイ実行手順

Freecash 構造で再構築済み。残りはユーザー側で以下3ステップを実行するだけ。

## STEP 1 — Service Role Key 取得 & .env.local 更新

1. https://supabase.com/dashboard/project/wrwowezsstkqjgkkqbtm/settings/api
2. **Project API keys → service_role** の値（`eyJhbG...` で始まる長い文字列）をコピー
3. `.env.local` を開き、`REPLACE_WITH_SERVICE_ROLE_KEY_FROM_DASHBOARD` をその値で置換

## STEP 2 — 直前修正をコミット & GitHub push

```bash
cd "/Users/okisaneatsu/Documents/Claude/Projects/Paid-to-missonモデルSaaS/task-reward"

# git lock が残っていれば除去（サンドボックスのエラー対策）
rm -f .git/HEAD.lock .git/index.lock

git add -A
git status               # 差分確認
git commit -m "feat: Freecash構造再構築 — Earn/Surveys/Tasks/Rewards 4セクション + ダーク系UI"
git push origin main
```

## STEP 3 — Cloudflare Pages にデプロイ

### 方法A：ダッシュボードからGit連携（推奨）

1. https://dash.cloudflare.com → Workers & Pages → **Create application** → **Pages** → **Connect to Git**
2. GitHub認証 → リポジトリ `jplabdiamond-jpg/task-reward` を選択
3. ビルド設定：
   - Project name: `task-reward`
   - Production branch: `main`
   - Framework preset: `Next.js`
   - Build command: `npx @cloudflare/next-on-pages`
   - Build output directory: `.vercel/output/static`
   - Root directory: `/`（リポジトリ直下に next.config.mjs があるため）
4. **Environment variables** → Production に追加：

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://wrwowezsstkqjgkkqbtm.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | （`.env.local` と同じ値） |
   | `SUPABASE_SERVICE_ROLE_KEY` | STEP 1 で取得した service_role key |
   | `NEXT_PUBLIC_APP_URL` | `https://task-reward.pages.dev`（最初のデプロイ後にURLが分かる） |
   | `ASP_WEBHOOK_SECRET_DEFAULT` | 32文字以上のランダム文字列（`openssl rand -hex 32` 等で生成） |
   | `NODE_VERSION` | `20` |

5. **Save and Deploy** をクリック
6. デプロイ完了後 → Settings → Functions → **Compatibility flags** に `nodejs_compat` を追加（Production / Preview の両方）
7. Deployments → **Retry deployment** で再ビルド
8. Settings → General → **Production branch deployment URL** をコピー → STEP 4 へ

### 方法B：CLIから直接デプロイ

```bash
cd "/Users/okisaneatsu/Documents/Claude/Projects/Paid-to-missonモデルSaaS/task-reward"
bash deploy.sh
```

`deploy.sh` 内で wrangler login → ビルド → デプロイまで自動実行。
環境変数は Cloudflare ダッシュボードで別途設定。

## STEP 4 — Supabase Auth の Site URL 更新

1. https://supabase.com/dashboard/project/wrwowezsstkqjgkkqbtm/auth/url-configuration
2. **Site URL** を Cloudflare Pages の本番URL（例 `https://task-reward.pages.dev`）に変更
3. **Redirect URLs** に同URL + `/**` を追加

## 動作確認チェックリスト

- [ ] `https://<本番URL>/` LP表示 → ダーク系
- [ ] `/signup` で新規登録 → tr_users にレコード作成
- [ ] `/login` でログイン → `/dashboard` リダイレクト
- [ ] `/earn` で7案件カード表示
- [ ] `/surveys` で6アンケート表示
- [ ] `/tasks` でタスク一覧表示
- [ ] `/rewards` で15交換オプション表示
- [ ] モバイル幅(375px)で横スクロールなし
- [ ] `/api/webhooks/asp/test` を curl で叩いて 401（署名なし）が返る
