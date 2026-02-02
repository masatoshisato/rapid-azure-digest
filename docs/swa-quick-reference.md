# SWA デプロイ クイックリファレンス

## 🚀 3分でデプロイ

### 1. 前提条件の確認
```bash
# 必要ツールのインストール
npm install -g @azure/static-web-apps-cli
brew install azure-cli jq  # macOS
az login
```

### 2. SWA作成 (Bicep使用)
```bash
cd infrastructure
./deploy-staticwebapp.sh \
  --subscription "YOUR_SUBSCRIPTION_ID" \
  --resource-group "YOUR_RESOURCE_GROUP" \
  --location "eastasia"  # 日本から最速
```

### 3. ファイルデプロイ
```bash
cd /path/to/your/project
swa deploy \
  --resource-group "YOUR_RESOURCE_GROUP" \
  --app-name "your-app-name" \
  --app-location "." \
  --env production
```

## ⚡ よく使うコマンド

```bash
# リージョン確認 (サポート: eastasia, eastus2, centralus, westeurope, westus2)
# ❌ japaneast は非サポート

# SWA一覧
az staticwebapp list --output table

# URL確認
az staticwebapp show --name "app-name" --resource-group "rg-name" --query "defaultHostname" -o tsv

# クリーンデプロイ (推奨)
cp index.html deploy-temp/
cp -r data/ deploy-temp/
swa deploy --resource-group "rg-name" --app-name "app-name" --app-location "./deploy-temp" --env production
```

## 🔧 トラブルシューティング

| エラー | 原因 | 解決法 |
|--------|------|--------|
| `japaneast not allowed` | 非サポートリージョン | `eastasia` を使用 |
| `File size exceeded` | ファイル制限 | `.sweignore` で除外 |
| `Authentication failed` | 認証切れ | `az logout && az login` |

## 📁 .sweignore (必須)
```
node_modules/
*.log
.env*
.DS_Store
infrastructure/
scripts/
docs/
```

---
💡 **忘れやすいポイント**: 
- `japaneast` は使えない → `eastasia` を使う
- 大きなファイル対策で `deploy-temp` フォルダを使う
- `.sweignore` で不要ファイルを除外する