# Azure Static Web Apps (SWA) デプロイメントガイド

## 📋 概要

このガイドでは、Azure Static Web Apps の作成から HTML ファイルのデプロイまでの完全な手順を説明します。

## 🛠 前提条件

- [Azure CLI](https://docs.microsoft.com/ja-jp/cli/azure/install-azure-cli) がインストール済み
- [Azure Static Web Apps CLI](https://azure.github.io/static-web-apps-cli/) がインストール済み
- Azureサブスクリプション
- `jq` コマンド (JSON処理用)

### インストール手順
```bash
# Azure CLI (macOS)
brew install azure-cli

# SWA CLI
npm install -g @azure/static-web-apps-cli

# jq (JSON処理)
brew install jq
```

## 🌐 対応リージョン

Azure Static Web Apps は以下のリージョンでのみ利用可能です：

| リージョン | コード | 日本からのレイテンシ | 推奨度 |
|------------|--------|---------------------|--------|
| 東アジア (香港) | `eastasia` | ~30-50ms | ⭐⭐⭐ **推奨** |
| 米国東部2 | `eastus2` | ~150-200ms | ⭐⭐ |
| 米国中部 | `centralus` | ~180-220ms | ⭐ |
| 西ヨーロッパ | `westeurope` | ~200-250ms | ⭐ |
| 米国西部2 | `westus2` | ~120-150ms | ⭐⭐ |

⚠️ **注意**: `japaneast` (東日本) は **サポートされていません**

## 🚀 デプロイ手順

### Step 1: Azure にログイン
```bash
az login
```

### Step 2: サブスクリプション設定
```bash
# サブスクリプション一覧を確認
az account list --output table

# 使用するサブスクリプションを設定
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

### Step 3: リソースグループ作成 (必要に応じて)
```bash
az group create --name "your-resource-group" --location "eastasia"
```

### Step 4: SWA インフラストラクチャのデプロイ

#### 方法A: Bicepテンプレート使用 (推奨)
```bash
cd infrastructure

# デフォルトリージョン (eastus2) でデプロイ
./deploy-staticwebapp.sh \
  --subscription "YOUR_SUBSCRIPTION_ID" \
  --resource-group "your-resource-group"

# 特定のリージョンを指定してデプロイ
./deploy-staticwebapp.sh \
  --subscription "YOUR_SUBSCRIPTION_ID" \
  --resource-group "your-resource-group" \
  --location "eastasia"
```

#### 方法B: Azure CLI 直接実行
```bash
az staticwebapp create \
  --name "your-app-name" \
  --resource-group "your-resource-group" \
  --location "eastasia" \
  --sku "Free"
```

### Step 5: HTMLファイルのデプロイ

#### 方法A: SWA CLI 使用 (推奨)
```bash
# プロジェクトルートディレクトリで実行
cd /path/to/your/project

# 本番環境にデプロイ
swa deploy \
  --resource-group "your-resource-group" \
  --app-name "your-app-name" \
  --app-location "." \
  --env production

# 特定フォルダからデプロイ
swa deploy \
  --resource-group "your-resource-group" \
  --app-name "your-app-name" \
  --app-location "./deploy-temp" \
  --env production
```

#### 方法B: Azure Portal 使用
1. [Azure Portal](https://portal.azure.com) にアクセス
2. 作成した Static Web App リソースを開く
3. 「ファイル」→ 「ファイルをアップロード」
4. 必要なファイルをアップロード

## 📁 ファイル構造例

```
project/
├── index.html          # メインページ
├── data/
│   └── news.json      # データファイル
├── assets/            # 静的アセット
│   ├── css/
│   ├── js/
│   └── images/
└── deploy-temp/       # デプロイ用クリーンフォルダ
    ├── index.html
    └── data/
        └── news.json
```

## 🔧 実用的なコマンド例

### デプロイ済みアプリの確認
```bash
# SWA一覧表示
az staticwebapp list --output table

# 特定のSWAの詳細確認
az staticwebapp show \
  --name "your-app-name" \
  --resource-group "your-resource-group"
```

### ドメイン情報取得
```bash
# ホスト名とURL取得
az staticwebapp show \
  --name "your-app-name" \
  --resource-group "your-resource-group" \
  --query "defaultHostname" --output tsv
```

### カスタムドメイン設定
```bash
az staticwebapp hostname set \
  --name "your-app-name" \
  --resource-group "your-resource-group" \
  --hostname "www.example.com"
```

## ⚠️ トラブルシューティング

### よくあるエラーと対処法

#### 1. リージョンエラー
```
Error: The value 'japaneast' is not part of the allowed values
```
**対処法**: サポートされているリージョン (`eastasia`, `eastus2` など) を使用

#### 2. ファイルサイズ制限
```
Error: File size limit exceeded
```
**対処法**: 
- `node_modules` を除外 (`.sweignore` ファイル使用)
- 大きなファイルを分割または圧縮

#### 3. 認証エラー
```
Error: Authentication failed
```
**対処法**:
```bash
az logout
az login
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

#### 4. デプロイ失敗
```
Error: Deployment failed
```
**対処法**:
- ファイルパスの確認 (絶対パスまたは正しい相対パス)
- `.sweignore` で不要ファイルを除外
- デプロイ用クリーンフォルダの使用

## 📝 .sweignore ファイル例

```gitignore
# SWA デプロイから除外するファイル
node_modules/
*.log
.env
.env.local
.DS_Store
*.tsbuildinfo
dist/
build/
temp/
.vscode/
.idea/
*.md
package*.json
tsconfig.json
infrastructure/
scripts/
docs/
```

## 🔄 継続的デプロイメント (GitHub Actions)

### GitHub連携設定
1. Azure Portal → Static Web App → 「ソース」
2. GitHub アカウントでサインイン
3. リポジトリとブランチを選択
4. ビルド設定を構成

### GitHub Actions ワークフロー例
```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches: [ main ]

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
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
          app_location: "/"
          api_location: ""
          output_location: ""
```

## 💡 ベストプラクティス

1. **リージョン選択**: 日本のユーザー向けには `eastasia` を使用
2. **ファイル最適化**: 不要なファイルを除外してデプロイサイズを最小化
3. **環境分離**: 開発・ステージング・本番環境を分離
4. **監視設定**: Application Insights でパフォーマンス監視
5. **バックアップ**: 重要なコンテンツは定期的にバックアップ

## 📚 関連リンク

- [Azure Static Web Apps ドキュメント](https://docs.microsoft.com/ja-jp/azure/static-web-apps/)
- [SWA CLI ドキュメント](https://azure.github.io/static-web-apps-cli/)
- [Bicep ドキュメント](https://docs.microsoft.com/ja-jp/azure/azure-resource-manager/bicep/)
- [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)

---

最終更新: 2026年2月2日