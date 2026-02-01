# Azure Static Web App 構成説明書

**作成日:** 2026年2月1日  
**プロジェクト:** rapid-azure-digest  
**目的:** Azure Static Web Apps による静的サイトホスティング構成

## 📋 構成概要

このディレクトリには、Azure Static Web Apps を使用してindex.htmlとdata/news.jsonをホストするためのインフラストラクチャコード（IaC）が含まれています。

### ファイル構成
```
infrastructure/
├── staticwebapp.bicep           # Bicep IaC テンプレート
├── staticwebapp.parameters.json # デプロイメント パラメータ
├── deploy-staticwebapp.sh       # デプロイメント スクリプト
└── README.md                    # 本ドキュメント
```

## 🎯 前提条件

### 必要なツール
- **Azure CLI** (最新版)
- **jq** (JSON処理用)
- **Bash** (macOS/Linux標準)

### Azure アカウント
- 有効な Azure サブスクリプション
- リソースグループ作成権限
- Azure CLI でのログイン済み

## 🚀 デプロイ手順

### 1. 基本的なデプロイ
```bash
cd infrastructure/
./deploy-staticwebapp.sh \
  --subscription "your-subscription-id" \
  --resource-group "rg-rapid-azure-digest"
```

### 2. カスタムリージョンでのデプロイ
```bash
./deploy-staticwebapp.sh \
  --subscription "your-subscription-id" \
  --resource-group "rg-rapid-azure-digest" \
  --location "westeurope"
```

### 3. GitHub統合付きデプロイ
```bash
./deploy-staticwebapp.sh \
  --subscription "your-subscription-id" \
  --resource-group "rg-rapid-azure-digest" \
  --repository "https://github.com/yourusername/rapid-azure-digest"
```

## ⚙️ パラメータカスタマイズ

### staticwebapp.parameters.json の編集
```json
{
  "parameters": {
    "staticWebAppName": {
      "value": "your-custom-name"        // アプリ名変更
    },
    "location": {
      "value": "westeurope"              // リージョン変更
    },
    "repositoryUrl": {
      "value": "https://github.com/..."  // GitHub連携
    },
    "appSettings": {
      "value": {
        "CUSTOM_SETTING": "value"        // カスタム設定追加
      }
    }
  }
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