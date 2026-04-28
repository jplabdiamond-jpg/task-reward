# Claude Code 実行プロンプト

下記をそのまま Claude Code に貼り付けて下さい。
Cowork側で再構築済みの最新コードを Claude Code が GitHub push → Cloudflare Pages デプロイまで一気通貫で実行します。

---

## 貼り付け用プロンプト（コピペ）

```
TaskReward (/Users/okisaneatsu/Documents/Claude/Projects/Paid-to-missonモデルSaaS/task-reward) を本番デプロイしてください。Freecash構造での再構築は完了済み、残りはGitHub push と Cloudflare Pages デプロイのみです。

【前提】
- リポジトリ: https://github.com/jplabdiamond-jpg/task-reward （origin設定済・コミット済・未push）
- Supabase: project_id wrwowezsstkqjgkkqbtm（復活済・全マイグレ適用済）
- Cloudflare Pages にデプロイ（Vercel無料は商用NGのため）

【手順】

1. /Users/okisaneatsu/Documents/Claude/Projects/Paid-to-missonモデルSaaS/task-reward に移動

2. .git のロックファイル除去
   rm -f .git/HEAD.lock .git/index.lock .git/objects/*/tmp_obj_*

3. git status で差分確認 → 残り差分があれば commit

4. git push origin main
   - 認証が必要なら gh CLI または SSH 鍵で実行

5. SUPABASE_SERVICE_ROLE_KEY 取得を案内：
   https://supabase.com/dashboard/project/wrwowezsstkqjgkkqbtm/settings/api
   → service_role key の値を聞いて .env.local の `REPLACE_WITH_SERVICE_ROLE_KEY_FROM_DASHBOARD` を置換

6. Cloudflare CLIデプロイ：
   - npm install（必要なら）
   - npx wrangler login（初回認証）
   - npm run pages:build
   - npx wrangler pages deploy .vercel/output/static --project-name=task-reward --branch=main --compatibility-flag=nodejs_compat

7. デプロイ後、Cloudflareダッシュボードで以下の環境変数を Production / Preview 両方に設定するよう案内：
   - NEXT_PUBLIC_SUPABASE_URL = https://wrwowezsstkqjgkkqbtm.supabase.co
   - NEXT_PUBLIC_SUPABASE_ANON_KEY = （.env.localと同じ値）
   - SUPABASE_SERVICE_ROLE_KEY = （手順5で取得した値）
   - NEXT_PUBLIC_APP_URL = （デプロイ後のpages.dev URL）
   - ASP_WEBHOOK_SECRET_DEFAULT = openssl rand -hex 32 で生成
   - NODE_VERSION = 20
   さらに Settings → Functions → Compatibility flags に nodejs_compat を追加（Production/Preview両方）

8. Supabase Auth の Site URL を本番URLに更新するよう案内：
   https://supabase.com/dashboard/project/wrwowezsstkqjgkkqbtm/auth/url-configuration

9. 動作確認：
   - https://<本番URL>/ で LP 表示
   - /signup → /login → /dashboard → /earn → /surveys → /tasks → /rewards 全ページ確認
   - モバイル幅(375px)で横スクロールなし
   - curl https://<本番URL>/api/webhooks/asp/test で 401 が返る（署名なし）

【重要ルール（プロジェクトCLAUDE.mdに準拠）】
- 既存機能は壊さない（Freecash構造で再構築済みの状態を維持）
- バグゼロ・本番即運用可能を最優先
- API Routes は全て edge runtime（Cloudflare Pages制約）
- 環境変数のキー名ズレ禁止
```

---

## なぜ Claude Code か

Cowork（私）のサンドボックスは：
- GitHub への push 認証ができない（gh CLI 未認証）
- Cloudflare へのログイン（ブラウザOAuth）ができない
- .git のロックファイルを削除できない（権限制限）

Claude Code はローカルのターミナル権限で動くため、これらが全て解決します。

## 実行前チェック

- [ ] Claude Code がインストール済み（`claude` コマンドが通る）
- [ ] ターミナルで gh CLI に認証済み（`gh auth status`）または SSH鍵設定済み
- [ ] Supabaseダッシュボードに jp.lab.diamond@gmail.com でログイン可能
- [ ] Cloudflareアカウント作成済み（無料）
