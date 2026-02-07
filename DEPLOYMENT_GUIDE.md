# Azure Functions デプロイ準備ガイド

## 🔧 事前準備

### 1. Azure CLI セットアップ
```bash
# Azure CLI インストール（macOS）
brew install azure-cli

# Azure にログイン
az login

# 利用可能なサブスクリプションを確認
az account list --output table
```

### 2. デプロイ前のビルド準備
```bash
# プロジェクトルートから
cd /Users/sato/proj/work/rapid-azure-digest

# 1. API をビルド
cd api
npm install
npm run build

# 2. フロントエンド準備（もしある場合）
cd ../frontend
# フロントエンドのビルド処理

# 3. プロジェクトをGitリポジトリにプッシュ
cd ..
git add .
git commit -m "Prepare for Azure deployment"
git push origin main
```

## 🚀 デプロイ方法

### Azure Static Web Apps デプロイ

#### 方法A: インフラスクリプト使用
```bash
cd infrastructure/

# 既存の本番環境にデプロイ
./deploy-staticwebapp.sh \
  --subscription "your-subscription-id" \
  --resource-group "DailyAzureNewsUpdate"

# 新しいリソースグループでデプロイ
./deploy-staticwebapp.sh \
  --subscription "your-subscription-id" \
  --resource-group "new-resource-group" \
  --repository "https://github.com/username/rapid-azure-digest"
```

#### 方法B: Azure CLI直接
```bash
# リソースグループ作成
az group create --name "rg-rapid-azure-digest" --location "eastus2"

# Static Web App作成
az staticwebapp create \
  --name "rapid-azure-digest-app" \
  --resource-group "rg-rapid-azure-digest" \
  --location "eastus2" \
  --source "https://github.com/username/rapid-azure-digest.git" \
  --branch "main" \
  --app-location "frontend" \
  --api-location "api" \
  --output-location ""
```

### Azure Functions 単体デプロイ（上級）

もしAzure Functions単体でデプロイする場合：

```bash
cd api/

# Functions App 作成
az functionapp create \
  --resource-group "rg-rapid-azure-digest" \
  --consumption-plan-location eastus2 \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name "rapid-azure-digest-api" \
  --storage-account "storageaccountname"

# デプロイ
func azure functionapp publish "rapid-azure-digest-api"
```

## 🌐 GitHub Actions自動デプロイ

### GitHub Actions設定
Static Web Appを作成すると、自動的にGitHub Actionsワークフローが作成されます：

```yaml
# .github/workflows/azure-static-web-apps-<random>.yml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
    - uses: actions/checkout@v3
      with:
        submodules: true
    - name: Build And Deploy
      id: builddeploy
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: "upload"
        app_location: "frontend"      # フロントエンドフォルダ
        api_location: "api"           # Azure Functions フォルダ
        output_location: ""           # ビルド出力フォルダ
```

## 🔗 環境変数設定

### Cosmos DB接続情報
```bash
# Azure Portal または CLI で設定
az functionapp config appsettings set \
  --name "rapid-azure-digest-api" \
  --resource-group "rg-rapid-azure-digest" \
  --settings \
  "COSMOS_DB_ENDPOINT=https://your-cosmos.documents.azure.com:443/" \
  "COSMOS_DB_KEY=your-cosmos-key" \
  "COSMOS_DB_DATABASE=NewsDatabase" \
  "COSMOS_DB_CONTAINER=Articles"
```

## 📊 デプロイ後の確認

```bash
# Static Web App URL確認
az staticwebapp show \
  --name "rapid-azure-digest-app" \
  --resource-group "rg-rapid-azure-digest" \
  --query "defaultHostname" -o tsv

# Functions App URL確認  
az functionapp show \
  --name "rapid-azure-digest-api" \
  --resource-group "rg-rapid-azure-digest" \
  --query "defaultHostName" -o tsv
```