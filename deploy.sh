#!/usr/bin/env bash
# TaskReward ワンコマンド公開スクリプト（Cloudflare Pages 版）
# 使い方: cd task-reward && bash deploy.sh
set -e

PROJECT_DIR="/Users/okisaneatsu/Documents/Claude/Projects/Paid-to-missonモデルSaaS/task-reward"
REPO_NAME="task-reward"
GIT_EMAIL="jp.lab.diamond@gmail.com"
GIT_USER="さね"
CF_PROJECT_NAME="task-reward"

cd "$PROJECT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TaskReward → Cloudflare Pages デプロイ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# STEP 0: .git 残骸クリーンアップ
if [ -d ".git" ] && [ -f ".git/index.lock" ]; then
  echo "🧹 壊れた .git を削除します（sudo 権限必要）"
  sudo rm -rf .git
fi

# STEP 1: Git 初期化
if [ ! -d ".git" ]; then
  echo "📦 Git 初期化..."
  git init -q
  git branch -M main
  git config user.email "$GIT_EMAIL"
  git config user.name "$GIT_USER"
  git add -A
  git commit -q -m "initial: TaskReward SaaS (Next.js 15 + Supabase + Cloudflare Pages)"
  echo "  ✓ 初回コミット完了"
else
  if [ -n "$(git status --porcelain)" ]; then
    git add -A
    git commit -q -m "chore: update for Cloudflare Pages deploy" || true
  fi
  echo "  ✓ Git リポジトリ更新済"
fi

# STEP 2: GitHub push
echo ""
echo "🚀 GitHub リポジトリ作成 & push..."
if command -v gh >/dev/null 2>&1; then
  if ! gh auth status >/dev/null 2>&1; then
    echo "  gh 認証が必要です。ブラウザが開きます..."
    gh auth login
  fi
  if gh repo view "$REPO_NAME" >/dev/null 2>&1; then
    if ! git remote | grep -q origin; then
      GH_USER=$(gh api user --jq .login)
      git remote add origin "https://github.com/$GH_USER/$REPO_NAME.git"
    fi
    git push -u origin main
  else
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
  fi
  REPO_URL="https://github.com/$(gh api user --jq .login)/$REPO_NAME"
  echo "  ✓ GitHub 公開: $REPO_URL"
else
  echo "⚠️  gh CLI がありません。手動push後に Cloudflare Pages ダッシュボードで連携:"
  echo "     brew install gh && gh auth login"
fi

# STEP 3: Cloudflare Pages デプロイ（CLI）
echo ""
echo "🌐 Cloudflare Pages デプロイ（CLI）..."
if [ ! -x "node_modules/.bin/wrangler" ] && ! command -v wrangler >/dev/null 2>&1; then
  echo "  📦 wrangler をインストール..."
  npm i -D wrangler @cloudflare/next-on-pages
fi

# wrangler login（初回のみ）
if ! npx wrangler whoami >/dev/null 2>&1; then
  echo "  🔐 Cloudflare ログイン..."
  npx wrangler login
fi

echo "  🏗️  next-on-pages ビルド..."
npm run pages:build

echo "  🚀 deploy..."
npx wrangler pages deploy .vercel/output/static --project-name="$CF_PROJECT_NAME" --branch=main \
  --compatibility-flag=nodejs_compat || \
  npx wrangler pages deploy .vercel/output/static --project-name="$CF_PROJECT_NAME"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ デプロイ完了"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "次のステップ:"
echo "  1. Cloudflare Pages ダッシュボードで環境変数を設定:"
echo "     Settings → Environment variables → Production / Preview"
echo "       NEXT_PUBLIC_SUPABASE_URL"
echo "       NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "       SUPABASE_SERVICE_ROLE_KEY"
echo "       NEXT_PUBLIC_APP_URL"
echo "       ASP_WEBHOOK_SECRET_DEFAULT"
echo "       ASP_WEBHOOK_SECRET_<PROVIDER>"
echo "  2. Settings → Functions → Compatibility flags に nodejs_compat を追加（Production/Preview両方）"
echo "  3. Supabase Auth の Site URL を本番ドメインに設定"
echo "  4. 再デプロイ"
