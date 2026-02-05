# SWA 設定サンプル集

## 📋 実際の設定ファイル例

### staticwebapp.parameters.json
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "staticWebAppName": {
      "value": "rapid-azure-digest"
    },
    "location": {
      "value": "eastasia"
    },
    "appSettings": {
      "value": {
        "BUILD_FLAGS": "",
        "SKIP_APP_BUILD": "false"
      }
    },
    "tags": {
      "value": {
        "project": "rapid-azure-digest",
        "environment": "production",
        "purpose": "azure-news-display",
        "tier": "free",
        "cost-center": "engineering",
        "auto-shutdown": "false"
      }
    }
  }
}
```

### .sweignore
```
# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
out/

# Development tools
.vscode/
.idea/
*.log

# OS generated
.DS_Store
Thumbs.db

# Project specific
infrastructure/
scripts/
docs/
*.md
package*.json
tsconfig.json
```

### deploy-staticwebapp.sh 実行例
```bash
#!/bin/bash
# 実際の実行例

```bash
# 1. 東アジア (香港) でデプロイ - 推奨
./deploy-staticwebapp.sh \
  --subscription "871e8b6f-0727-42ce-840e-02bf7d76541a" \
  --resource-group "DailyAzureNewsUpdate" \
  --location "eastasia"

# 2. デフォルト (eastus2) でデプロイ - 現在の設定
./deploy-staticwebapp.sh \
  --subscription "871e8b6f-0727-42ce-840e-02bf7d76541a" \
  --resource-group "DailyAzureNewsUpdate"

# 成功時の出力例:
# [SUCCESS] デプロイメント完了!
# • サイト URL: https://salmon-beach-0b86ff00f.4.azurestaticapps.net
# • リージョン: East US 2
```

### SWA CLI デプロイ例
```bash
# プロダクション環境へのデプロイ - 実際の設定
swa deploy \
  --resource-group "DailyAzureNewsUpdate" \
  --app-name "rapid-azure-digest" \
  --app-location "./deploy-temp" \
  --env production

# 成功時の出力例:
# ✔ Project deployed to https://salmon-beach-0b86ff00f.4.azurestaticapps.net 🚀
```

## 🌐 リージョン別設定例

### 日本向け (推奨)
```json
{
  "location": {
    "value": "eastasia"
  }
}
```
- レイテンシ: ~30-50ms
- 地理的に最も近い

### グローバル向け
```json
{
  "location": {
    "value": "eastus2"
  }
}
```
- デフォルト設定
- 多くのサンプルで使用

## 📱 実際のプロジェクト構造

```
rapid-azure-digest/
├── index.html                 # メインページ
├── data/
│   └── news.json             # ニュースデータ (213KB)
├── deploy-temp/              # クリーンデプロイ用
│   ├── index.html
│   └── data/
│       └── news.json
├── infrastructure/
│   ├── staticwebapp.bicep
│   ├── staticwebapp.parameters.json
│   └── deploy-staticwebapp.sh
├── .sweignore               # SWAデプロイ除外設定
├── .gitignore              # Git除外設定
└── package.json            # 依存関係管理
```

## 🔄 デプロイフロー実例

### 1. 開発からデプロイまで
```bash
# 1. コンテンツ更新
npm run update-news

# 2. デプロイ用フォルダ準備
cp index.html deploy-temp/
cp -r data/ deploy-temp/

# 3. 本番デプロイ
swa deploy \
  --resource-group "DailyAzureNewsUpdate" \
  --app-name "rapid-azure-digest" \
  --app-location "./deploy-temp" \
  --env production

# 4. Git管理
git add .
git commit -m "chore: update deployment content"
git push origin main
```

### 2. 新しいSWA作成からデプロイまで
```bash
# 1. インフラ作成
cd infrastructure
./deploy-staticwebapp.sh \
  --subscription "YOUR_SUBSCRIPTION_ID" \
  --resource-group "YOUR_RESOURCE_GROUP" \
  --location "eastasia"

# 2. 初回デプロイ
cd ..
swa deploy \
  --resource-group "YOUR_RESOURCE_GROUP" \
  --app-name "your-app-name" \
  --app-location "." \
  --env production

# 3. URL確認
az staticwebapp show \
  --name "your-app-name" \
  --resource-group "YOUR_RESOURCE_GROUP" \
  --query "defaultHostname" -o tsv
```

## 💡 実用的なTips

### ファイルサイズ最適化
```bash
# デプロイ前サイズ確認
du -sh deploy-temp/

# 大きなファイルを特定
find deploy-temp/ -type f -size +1M -ls
```

### デプロイ状況確認
```bash
# SWA詳細情報
az staticwebapp show \
  --name "rapid-azure-digest" \
  --resource-group "DailyAzureNewsUpdate" \
  --output table
```

### ログ確認
```bash
# SWA CLI デバッグモード
swa deploy --verbose \
  --resource-group "DailyAzureNewsUpdate" \
  --app-name "rapid-azure-digest" \
  --app-location "./deploy-temp" \
  --env production
```

---

このサンプル集は実際のプロジェクトで使用されている設定を基にしています。
最終更新: 2026年2月2日