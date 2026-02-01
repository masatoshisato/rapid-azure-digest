#!/bin/bash

echo "=== GitHub Actions ワークフロー実行結果チェック ==="
echo "作成日時: $(date '+%Y/%m/%d %H:%M:%S')"
echo ""

# 最新のデータファイル確認
echo "📁 data/news.json の最新情報:"
if [ -f "data/news.json" ]; then
  echo "  ファイルサイズ: $(wc -c < data/news.json) bytes"
  echo "  最終更新: $(stat -f "%Sm" data/news.json)"
  echo "  記事数: $(jq '.articles | length' data/news.json 2>/dev/null || echo 'jq未インストール')"
  echo "  最終処理日時: $(jq -r '.lastUpdated' data/news.json 2>/dev/null || echo 'jq未インストール')"
else
  echo "  ❌ data/news.json が見つかりません"
fi

echo ""

# 最新コミット確認
echo "📝 最新のGitコミット:"
git log --oneline -5 --grep="Azure news" || git log --oneline -3

echo ""

# GitHub Actions の直接確認方法
echo "🔍 GitHub Actions 確認方法:"
echo "  1. ブラウザで以下にアクセス:"
echo "     https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[\/:]\(.*\)\.git/\1/')/actions"
echo ""
echo "  2. 'Daily Azure News Update' ワークフローをクリック"
echo "  3. 最新の実行結果を確認"
echo ""

# 次回実行予定確認
echo "⏰ 次回自動実行予定:"
echo "  毎日 午前0時 JST (15:00 UTC)"
echo "  次回: $(date -v+1d '+%Y/%m/%d 00:00 JST')"

echo ""
echo "=== 確認完了 ==="