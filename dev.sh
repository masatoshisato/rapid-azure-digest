#!/bin/bash
#
# 開発環境起動スクリプト
# - Node.js v20を自動的に設定
# - Azure Static Web Apps エミュレーターを起動
# - フロントエンド (http://localhost:4280) + API (http://localhost:7071) を同時起動
#
# 使用方法:
#   npm run dev       # package.jsonから実行（推奨）
#   ./dev.sh          # 直接実行
#
export PATH="/usr/local/opt/node@20/bin:$PATH"
echo "🚀 Using Node.js v$(node --version)"
echo "📦 Starting SWA emulator with frontend and API..."
echo "🌐 Frontend: http://localhost:4280"
echo "🔌 API: http://localhost:7071/api/articles"
echo ""
swa start frontend --api-location api