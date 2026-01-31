#!/bin/bash

echo "=== GitHub Actions Workflow Debug Script ==="
echo "Simulating: Daily Azure News Update"
echo ""

# Step 1: チェックアウト（既にローカルなのでスキップ）
echo "✅ Step 1: Repository already checked out (local)"
echo ""

# Step 2: Node.js セットアップ確認
echo "🔍 Step 2: Node.js Setup Check"
echo "Current Node.js version: $(node --version)"
echo "Expected: v23.x"
if [[ $(node --version) == v23* ]]; then
  echo "✅ Node.js version matches"
else
  echo "⚠️ Node.js version mismatch"
fi
echo ""

# Step 3: 依存関係インストール
echo "🔍 Step 3: Dependencies Installation"
echo "Running: npm install"
npm install
if [ $? -eq 0 ]; then
  echo "✅ Dependencies installed successfully"
else
  echo "❌ Dependencies installation failed"
  exit 1
fi
echo ""

# Step 4: Azure RSS処理実行
echo "🔍 Step 4: Azure RSS Processing"
echo "Running: npx tsx scripts/update-news.ts"

# 環境変数チェック
if [ -f .env ]; then
  source .env
  echo "✅ Environment variables loaded from .env"
else
  echo "⚠️ No .env file found - using environment variables"
fi

if [ -z "$GROQ_API_KEY" ]; then
  echo "❌ GROQ_API_KEY not set"
  echo "Please set GROQ_API_KEY in .env file or environment"
  exit 1
else
  echo "✅ GROQ_API_KEY is set"
fi

# data/news.json のバックアップ
if [ -f "data/news.json" ]; then
  cp data/news.json data/news.json.backup
  echo "✅ Created backup: data/news.json.backup"
fi

# スクリプト実行
npx tsx scripts/update-news.ts
SCRIPT_EXIT_CODE=$?

if [ $SCRIPT_EXIT_CODE -eq 0 ]; then
  echo "✅ Azure RSS processing completed successfully"
else
  echo "❌ Azure RSS processing failed (exit code: $SCRIPT_EXIT_CODE)"
fi
echo ""

# Step 5: 変更検知・コミット（模擬）
echo "🔍 Step 5: Change Detection Simulation"

# Git設定（テスト用）
git config --local user.email "action@github.com"
git config --local user.name "github-actions[bot]"
echo "✅ Git configuration set"

# 変更チェック
if git diff --quiet data/news.json; then
  echo "📝 No changes in news.json"
  echo "Workflow would skip commit step"
else
  echo "📝 Changes detected in news.json"
  echo "Workflow would commit and push changes"
  
  echo ""
  echo "🔍 Changes preview:"
  git diff data/news.json | head -10
  
  echo ""
  echo "Would run:"
  echo "  git add data/news.json"
  echo "  git commit -m 'feat: update Azure news data [skip ci]'"
  echo "  git push"
  
  # 実際にはコミットしない（デバッグモード）
  echo ""
  echo "⚠️ DEBUG MODE: Not actually committing"
fi

echo ""
echo "=== Workflow Debug Complete ==="

# バックアップファイルの復元オプション
if [ -f "data/news.json.backup" ]; then
  echo ""
  read -p "Restore backup? (y/N): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    mv data/news.json.backup data/news.json
    echo "✅ Backup restored"
  else
    rm data/news.json.backup
    echo "✅ Backup removed"
  fi
fi