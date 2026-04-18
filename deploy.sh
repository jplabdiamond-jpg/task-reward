#!/usr/bin/env bash
# TaskReward ワンコマンド公開スクリプト
# 使い方: cd task-reward && bash deploy.sh
set -e

PROJECT_DIR="/Users/okisaneatsu/Documents/Claude/Projects/Paid-to-missonモデルSaaS/task-reward"
REPO_NAME="task-reward"
GIT_EMAIL="jp.lab.diamond@gmail.com"
GIT_USER="さね"

cd "$PROJECT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TaskReward 公開スクリプト"
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
  git commit -q -m "initial: TaskReward SaaS (Next.js 15 + Supabase)"
  echo "  ✓ 初回コミット完了"
else
  echo "  ✓ Git リポジトリは既に存在します"
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
    echo "  ✓ リポジトリは既に存在します。push のみ実行"
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
  echo "⚠️  gh CLI がありません。以下のコマンドで手動push:"
  echo "     brew install gh"
  echo "     gh auth login"
  echo "     bash deploy.sh  # 再実行"
  echo ""
  echo "   または GitHub Web UI で task-reward リポジトリ作成後:"
  echo "     git remote add origin https://github.com/<user>/$REPO_NAME.git"
  echo "     git push -u origin main"
  exit 0
fi

# STEP 3: Vercel デプロイ
echo ""
echo "🌐 Vercel デプロイ..."
if command -v vercel >/dev/null 2>&1; then
  echo "  ⚙️  初回セットアップが必要な場合は対話プロンプトに答えてください"
  vercel --prod --yes || vercel --prod
  echo "  ✓ Vercel 本番デプロイ完了"
else
  echo "⚠️  vercel CLI がありません。以下で install & deploy:"
  echo "     npm i -g vercel"
  echo "     vercel login"
  echo "     vercel --prod"
  echo ""
  echo "   または https://vercel.com/new で task-reward リポジトリをImport"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ 公開完了"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "次のステップ:"
echo "  1. Vercel Project Settings で環境変数を設定（DEPLOY.md §STEP 4）"
echo "  2. Supabase Auth の Site URL を Vercel本番URLに変更（DEPLOY.md §STEP 5）"
echo "  3. Redeploy して動作確認"
