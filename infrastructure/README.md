# Infrastructure (Azure Resources)

**プロジェクト:** rapid-azure-digest  
**目的:** Azure Static Web Apps + Cosmos DB + Azure Functions による AI翻訳Azureニュースサイトの完全なインフラ構成  
**最終更新:** 2026年2月11日

## 📋 インフラ概要

このディレクトリには、Azure Static Web Apps、Azure Cosmos DB、および Azure Functions を組み合わせたニュースサイトシステムのInfrastructure as Code (IaC)が含まれています。

### ファイル構成
```
infrastructure/
├── staticwebapp.bicep           # Static Web Apps Bicep テンプレート
├── staticwebapp.parameters.json # SWA デプロイメント パラメータ
├── deploy-staticwebapp.sh       # SWA 自動化デプロイメント スクリプト
├── cosmosdb.bicep              # Cosmos DB Bicep テンプレート
├── cosmosdb.parameters.json    # Cosmos DB デプロイメント パラメータ
├── deploy-cosmosdb.sh          # Cosmos DB 自動化デプロイメント スクリプト
└── README.md                   # 本ドキュメント
```

### アーキテクチャ構成
```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Azure Static      │    │   Azure Functions   │    │   Azure Cosmos DB   │
│   Web Apps          │───▶│   (update-articles) │───▶│   (NewsDatabase)    │
│                     │    │                     │    │                     │
│ • frontend/         │    │ • HTTP Triggers     │    │ • Articles Container│
│ • api/ (Functions)  │    │ • Timer Triggers    │    │ • SQL API          │
│ • GitHub Actions CI│    │ • Groq AI Integration│   │ • Auto-scaling     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

## 🎯 前提条件

### 必要なツール
- **Azure CLI** (最新版) - `az --version`
- **jq** (JSON処理用) - `brew install jq` (macOS)
- **Bash** (macOS/Linux標準)

### Azure アカウント要件
- 有効な Azure サブスクリプション
- リソースグループ作成権限
- Static Web Apps、Cosmos DB、Functions 作成権限
- Azure CLI でのログイン済み (`az login`)

## 🏗️ 現在の本番環境

### Azure Static Web Apps
- **URL**: https://salmon-beach-0b86ff00f.4.azurestaticapps.net
- **リソース名**: `rapid-azure-digest`
- **リソースグループ**: `DailyAzureNewsUpdate`
- **リージョン**: `East US 2`
- **プラン**: Free

### Azure Cosmos DB
- **アカウント名**: (要確認)
- **データベース名**: `NewsDatabase`
- **コンテナ名**: `Articles`
- **パーティションキー**: `/id`
- **プラン**: Serverless (自動スケーリング)

## 🚀 完全なデプロイ手順

### 1. Cosmos DB デプロイ (必須 - 先に実行)
```bash
cd infrastructure/

# Cosmos DB 作成
./deploy-cosmosdb.sh \
  --subscription "871e8b6f-0727-42ce-840e-02bf7d76541a" \
  --resource-group "DailyAzureNewsUpdate"

# 接続文字列を取得して記録
az cosmosdb show-connection-string \
  --resource-group "DailyAzureNewsUpdate" \
  --name "rapid-azure-digest-cosmos" \
  --type connection_strings
```

### 2. Static Web Apps デプロイ (API Functions 含む)
```bash
# SWA + Functions デプロイ
./deploy-staticwebapp.sh \
  --subscription "871e8b6f-0727-42ce-840e-02bf7d76541a" \
  --resource-group "DailyAzureNewsUpdate"
```

### 3. 環境変数設定 (Functions 用)
```bash
# Function App に Cosmos DB 接続設定
az functionapp config appsettings set \
  --name "rapid-azure-digest" \
  --resource-group "DailyAzureNewsUpdate" \
  --settings \
    "COSMOS_DB_ENDPOINT=https://rapid-azure-digest-cosmos.documents.azure.com:443/" \
    "COSMOS_DB_KEY=your-cosmos-primary-key" \
    "COSMOS_DB_DATABASE_NAME=NewsDatabase" \
    "COSMOS_DB_CONTAINER_NAME=Articles" \
    "GROQ_API_KEY=your-groq-api-key" \
    "ARTICLE_RETENTION_DAYS=30"
```

## ⚙️ Azure Static Web Apps 設定

### サポートリージョン
| リージョン | コード | 日本からの推奨度 |
|------------|--------|------------------|
| 東アジア (香港) | `eastasia` | ⭐⭐⭐ **推奨** |
| 米国東部2 | `eastus2` | ⭐⭐ **(現在使用中)** |
| 米国中部 | `centralus` | ⭐ |
| 西ヨーロッパ | `westeurope` | ⭐ |
| 米国西部2 | `westus2` | ⭐⭐ |

⚠️ **注意**: `japaneast` は**サポートされていません**

### 無料枠の制限
| 項目 | 制限 |
|------|------|
| 帯域幅 | 100 GB/月 |
| ストレージ | 0.5 GB |
| ステージング環境 | 3個 |
| カスタムドメイン | 2個 |
| SSL証明書 | 自動 |
| Functions | 無制限 (Consumption) |

## ⚙️ Azure Cosmos DB 設定

### パフォーマンス設定
```json
{
  "cosmosAccountName": "rapid-azure-digest-cosmos",
  "databaseName": "NewsDatabase",
  "containerName": "Articles",
  "partitionKey": "/id",
  "throughput": "serverless"
}
```

### データベースプロパティ
- **API**: SQL (Core) API
- **スループット**: Serverless (オンデマンド)
- **地理的冗長性**: 無効 (コスト最適化)
- **自動フェイルオーバー**: 無効
- **マルチリージョン書き込み**: 無効

### コンテナ設定
```json
{
  "containerProperties": {
    "id": "Articles",
    "partitionKey": {
      "paths": ["/id"],
      "kind": "Hash"
    },
    "uniqueKeyPolicy": {
      "uniqueKeys": [
        {
          "paths": ["/url", "/title"]
        }
      ]
    },
    "defaultTtl": 2592000
  }
}
```

## 🔧 カスタムデプロイ設定

### 異なるリージョンでデプロイ
```bash
# 東アジア（香港）での最適化デプロイ
./deploy-staticwebapp.sh \
  --subscription "your-subscription-id" \
  --resource-group "rg-rapid-azure-digest" \
  --location "eastasia"

./deploy-cosmosdb.sh \
  --subscription "your-subscription-id" \
  --resource-group "rg-rapid-azure-digest" \
  --location "eastasia"
```

### パラメータファイル カスタマイズ

#### staticwebapp.parameters.json
```json
{
  "parameters": {
    "staticWebAppName": {
      "value": "your-custom-name"
    },
    "location": {
      "value": "eastasia"
    },
    "repositoryUrl": {
      "value": "https://github.com/yourusername/rapid-azure-digest"
    },
    "appSettings": {
      "value": {
        "NODE_ENV": "production",
        "WEBSITE_RUN_FROM_PACKAGE": "1"
      }
    }
  }
}
```

#### cosmosdb.parameters.json
```json
{
  "parameters": {
    "cosmosAccountName": {
      "value": "your-cosmos-account-name"
    },
    "databaseName": {
      "value": "NewsDatabase"
    },
    "containerName": {
      "value": "Articles"
    },
    "location": {
      "value": "eastasia"
    }
  }
}
```

## 📊 監視・管理

### リソース状態確認
```bash
# Static Web Apps 確認
az staticwebapp show \
  --resource-group "DailyAzureNewsUpdate" \
  --name "rapid-azure-digest" \
  --query "defaultHostname"

# Cosmos DB 確認
az cosmosdb show \
  --resource-group "DailyAzureNewsUpdate" \
  --name "rapid-azure-digest-cosmos" \
  --query "documentEndpoint"

# Functions 確認
az functionapp show \
  --resource-group "DailyAzureNewsUpdate" \
  --name "rapid-azure-digest" \
  --query "hostNames"
```

### コスト監視
```bash
# 現在のコスト (過去30日)
az consumption usage list \
  --top 10 \
  --output table
```

### Application Insights ログ
Azure Portal → Application Insights → Logs (KQL クエリ)

## 🔄 CI/CD 設定

### GitHub Actions 自動設定
repositoryUrl パラメータを設定すると：
- `.github/workflows/azure-static-web-apps-*.yml` 自動作成
- `main` ブランチへのプッシュで自動デプロイ
- プレビュー環境の自動作成・削除

### 手動アップロード
```bash
# Azure Static Web Apps CLI使用
npm install -g @azure/static-web-apps-cli

swa deploy \
  --resource-group "DailyAzureNewsUpdate" \
  --app-name "rapid-azure-digest" \
  --app-location "frontend" \
  --api-location "api"
```

## 🛡️ セキュリティ・権限設定

### Managed Identity 設定
```bash
# Functions App の Managed Identity 有効化
az functionapp identity assign \
  --resource-group "DailyAzureNewsUpdate" \
  --name "rapid-azure-digest"

# Cosmos DB アクセス権限付与
az cosmosdb sql role assignment create \
  --account-name "rapid-azure-digest-cosmos" \
  --resource-group "DailyAzureNewsUpdate" \
  --scope "/" \
  --principal-id "functions-managed-identity-object-id" \
  --role-definition-id "00000000-0000-0000-0000-000000000002"
```

### Function Key セキュリティ
```bash
# Function Key 取得 (認証用)
az functionapp function keys list \
  --resource-group "DailyAzureNewsUpdate" \
  --name "rapid-azure-digest" \
  --function-name "updateArticlesManual"
```

## 🗑️ リソース削除

### 段階的削除
```bash
# 1. Static Web Apps 削除
az staticwebapp delete \
  --resource-group "DailyAzureNewsUpdate" \
  --name "rapid-azure-digest"

# 2. Cosmos DB 削除 (データ保持期間後)
az cosmosdb delete \
  --resource-group "DailyAzureNewsUpdate" \
  --name "rapid-azure-digest-cosmos"
```

### 完全削除
```bash
# リソースグループ全体削除
az group delete \
  --resource-group "DailyAzureNewsUpdate" \
  --yes --no-wait
```

## ⚠️ トラブルシューティング

### デプロイメント失敗
```bash
# Bicep テンプレート検証
az deployment group validate \
  --resource-group "DailyAzureNewsUpdate" \
  --template-file staticwebapp.bicep \
  --parameters "@staticwebapp.parameters.json"

az deployment group validate \
  --resource-group "DailyAzureNewsUpdate" \
  --template-file cosmosdb.bicep \
  --parameters "@cosmosdb.parameters.json"
```

### Cosmos DB 接続エラー
```bash
# 接続文字列確認
az cosmosdb keys list \
  --resource-group "DailyAzureNewsUpdate" \
  --name "rapid-azure-digest-cosmos" \
  --type connection-strings

# ファイアウォール設定確認
az cosmosdb network-rule list \
  --resource-group "DailyAzureNewsUpdate" \
  --name "rapid-azure-digest-cosmos"
```

### Functions デプロイエラー
```bash
# Functions App ログストリーム
az webapp log tail \
  --resource-group "DailyAzureNewsUpdate" \
  --name "rapid-azure-digest"

# 設定確認
az functionapp config appsettings list \
  --resource-group "DailyAzureNewsUpdate" \
  --name "rapid-azure-digest"
```

## 💰 コスト最適化

### 推定月額コスト (Free Tier)
- **Static Web Apps**: $0 (Free)
- **Azure Functions**: ~$0-5 (低負荷)
- **Cosmos DB**: ~$1-10 (Serverless)
- **Storage Account**: ~$1 (Functions用)
- **Application Insights**: ~$0-2 (ログ量次第)

**合計: ~$2-17/月** (想定負荷)

### コスト監視アラート
```bash
# 予算アラート作成
az consumption budget create \
  --resource-group "DailyAzureNewsUpdate" \
  --budget-name "monthly-budget" \
  --amount 20 \
  --time-grain Monthly
```

## 📚 参考ドキュメント

- [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Cosmos DB](https://docs.microsoft.com/azure/cosmos-db/)
- [Azure Functions](https://docs.microsoft.com/azure/azure-functions/)
- [Azure Verified Modules](https://github.com/Azure/bicep-registry-modules)
- [Bicep Language Reference](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)

---

**作成者:** GitHub Copilot  
**最終更新:** 2026年2月11日  
**プロジェクト:** rapid-azure-digest Infrastructure ガイド
}
```

## 🔧 Azure Static Web Apps 仕様

### 無料枠の制限
| 項目 | 制限 |
|------|------|
| 帯域幅 | 100 GB/月 |
| ストレージ | 0.5 GB |
| ステージング環境 | 3個 |
| カスタムドメイン | 2個 |
| SSL証明書 | 自動 |
| Functions | 無制限 (Consumption) |

### サポート地域
- `centralus`
- `eastus2`
- `eastasia`
- `westeurope`
- `westus2`

## 📤 ファイルアップロード

### Azure Static Web Apps CLI使用
```bash
# CLI インストール
npm install -g @azure/static-web-apps-cli

# ファイルアップロード
swa deploy \
  --resource-group "rg-rapid-azure-digest" \
  --app-name "rapid-azure-digest" \
  --app-location "."
```

### Azure Portal使用
1. Azure Portal → Static Web Apps
2. アプリを選択
3. "Functions and API" → "Browse files"
4. ファイルをドラッグ＆ドロップ

## 🔄 CI/CD設定

### GitHub Actions 自動設定
repositoryUrl パラメータを設定すると：
- `.github/workflows/` に GitHub Actions ワークフロー自動作成
- `main` ブランチへのプッシュで自動デプロイ
- プレビュー環境の自動作成

### 手動設定
GitHub リポジトリがない場合：
1. ローカルファイルをアップロード
2. 手動更新でコンテンツ管理

## 🛡️ セキュリティ設定

### パブリックアクセス制御
```json
"publicNetworkAccess": {
  "value": "Enabled"    // または "Disabled"
}
```

### ステージング環境制御
```json
"stagingEnvironmentPolicy": {
  "value": "Enabled"    // または "Disabled"
}
```

## 📊 監視・管理

### デプロイメント状態確認
```bash
# Azure CLI での確認
az staticwebapp show \
  --resource-group "rg-rapid-azure-digest" \
  --name "rapid-azure-digest"

# URL確認
az staticwebapp show \
  --resource-group "rg-rapid-azure-digest" \
  --name "rapid-azure-digest" \
  --query "defaultHostname" \
  --output tsv
```

### ログ確認
Azure Portal → Static Web Apps → Monitoring → Logs

## 🗑️ リソース削除

### 個別削除
```bash
az staticwebapp delete \
  --resource-group "rg-rapid-azure-digest" \
  --name "rapid-azure-digest"
```

### リソースグループごと削除
```bash
az group delete \
  --resource-group "rg-rapid-azure-digest" \
  --yes --no-wait
```

## ⚠️ トラブルシューティング

### よくある問題

#### 1. デプロイメント失敗
```bash
# バリデーション実行
az deployment group validate \
  --resource-group "rg-rapid-azure-digest" \
  --template-file staticwebapp.bicep \
  --parameters "@staticwebapp.parameters.json"
```

#### 2. 名前重複エラー
Static Web App名は globally unique である必要があります：
```json
"staticWebAppName": {
  "value": "rapid-azure-digest-{unique-suffix}"
}
```

#### 3. 権限エラー
必要な Azure ロール：
- `Contributor` (リソース作成用)
- `Static Web App Contributor` (アプリ管理用)

### 設定確認コマンド
```bash
# Azure CLI ログイン状態
az account show

# 利用可能サブスクリプション
az account list --output table

# Static Web Apps 一覧
az staticwebapp list --output table
```

## 📚 関連ドキュメント

- [Azure Static Web Apps ドキュメント](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Verified Modules](https://github.com/Azure/bicep-registry-modules)
- [Azure Static Web Apps CLI](https://docs.microsoft.com/azure/static-web-apps/static-web-apps-cli)
- [GitHub Actions for Azure](https://docs.microsoft.com/azure/developer/github/)

---

**作成者:** GitHub Copilot  
**最終更新:** 2026年2月1日  
**プロジェクト:** rapid-azure-digest Azure Static Web Apps 構成