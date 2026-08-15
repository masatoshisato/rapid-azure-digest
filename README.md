# Rapid Azure Digest

Azure関連ニュースを自動収集・AI要約してWebサイト配信するフルスタックWebアプリケーションです。Azure Static Web Apps + Azure Functions + Cosmos DBの構成でクラウドネイティブに設計されています。

## 🏗️ システム構成

```
┌──────────────────┐    ┌────────────────────┐    ┌─────────────────┐
│   Frontend       │───▷│   API Functions    │───▷│   Database      │
│ (Static web Apps)│    │ (Azure Functions   │    │ (Cosmos DB)     │
│                  │    │  TypeScript)       │    │                 │
└──────────────────┘    └────────────────────┘    └─────────────────┘
                                 │
                        ┌────────────────────┐
                        │ Update Functions   │
                        │ (Timer + HTTP      │
                        │  RSS→AI→DB)       │
                        └────────────────────┘
```

### 技術スタック
- **フロントエンド**: HTML5, Vanilla JavaScript, CSS3 (Azure Static Web Apps)
- **API**: Azure Functions v4, TypeScript, Node.js 22
- **データ処理**: Azure Functions v4 (Timer/HTTP Triggers)
- **AI要約**: Groq SDK (OpenAI GPT-OSS 120B)
- **データベース**: Azure Cosmos DB (NoSQL, Serverless)
- **インフラ**: Bicep (Infrastructure as Code)
- **開発環境**: SWA CLI + Azure Functions Core Tools

## 🚀 主な機能

- **自動ニュース取得**: Timer Function による定期RSS収集 (6時間毎)
- **AI要約**: Groq の OpenAI GPT-OSS 120B による高品質日本語要約
- **手動更新**: HTTP Function による緊急時手動実行
- **リアルタイム配信**: Azure Static Web Apps でのグローバル配信
- **レスポンシブUI**: モバイル・タブレット・デスクトップ完全対応
- **エラーハンドリング**: 詳細エラー情報・スタックトレース出力

## 📁 プロジェクト構成

```
rapid-azure-digest/
├── frontend/                    # フロントエンドアプリケーション
│   ├── index.html              # メインページ (SPA)
│   ├── staticwebapp.config.json # Azure SWA 設定
│   └── README.md               # フロントエンド詳細ガイド
├── api/                        # Azure Functions API (記事取得)
│   ├── src/
│   │   ├── functions/
│   │   │   ├── articles.ts     # 記事取得API実装
│   │   │   └── logger.ts       # ロギング機能
│   │   └── index.ts            # Function app 登録
│   ├── package.json            # API依存関係
│   ├── host.json               # Azure Functions設定
│   ├── local.settings.json.example # 設定テンプレート
│   └── README.md               # API詳細ドキュメント
├── update-articles/            # Azure Functions (データ更新)
│   ├── src/
│   │   ├── functions/
│   │   │   ├── update-articles-manual.ts  # HTTPトリガー
│   │   │   └── update-articles-timer.ts   # Timerトリガー
│   │   ├── lib/
│   │   │   ├── news-processor.ts          # RSS・AI・DB処理
│   │   │   └── types.ts                   # 型定義・Logger
│   │   └── index.ts            # Function app 登録
│   ├── check-cosmos.ts         # Cosmos DB動作確認
│   ├── check-urls.ts           # RSS URL確認
│   ├── package.json            # 更新機能依存関係
│   ├── host.json               # Functions設定
│   ├── local.settings.json.example # 設定テンプレート
│   └── README.md               # 更新機能詳細ガイド
├── infrastructure/             # Azure Infrastructure as Code
│   ├── staticwebapp.bicep      # Static Web Apps Bicep
│   ├── staticwebapp.parameters.json
│   ├── cosmosdb.bicep          # Cosmos DB Bicep
│   ├── cosmosdb.parameters.json
│   ├── deploy-staticwebapp.sh  # SWA デプロイスクリプト
│   ├── deploy-cosmosdb.sh      # Cosmos DB デプロイスクリプト
│   └── README.md               # インフラデプロイガイド
├── archive/                    # プロジェクトドキュメント
│   ├── docs/                   # 設計書・仕様書・レポート
│   └── README.md               # アーカイブ管理ガイド
└── README.md                   # このファイル
```

## 🚀 クイックスタート

### 前提条件
- **Node.js**: v22.0.0以上
- **Azure Functions Core Tools**: v4.6.0以上
- **Azure CLI**: 最新版
- **Azure Cosmos DB**: アクティブなインスタンス

### 初回セットアップ
```bash
# 1. リポジトリクローン
git clone <repository-url>
cd rapid-azure-digest

# 2. API依存関係インストール
cd api && npm install
cd ../update-articles && npm install

# 3. 環境設定ファイル作成
cd api
cp local.settings.json.example local.settings.json
cd ../update-articles  
cp local.settings.json.example local.settings.json

# 4. 環境変数設定 (両方のlocal.settings.jsonで)
# COSMOS_DB_ENDPOINT, COSMOS_DB_KEY, GROQ_API_KEY等を設定

# 5. TypeScriptビルド
cd api && npm run build
cd ../update-articles && npm run build
```

### ローカル開発実行

#### SWA統合開発環境 (推奨)
```bash
# フロントエンド + API Functions 同時起動
swa start frontend --api-location api --api-language node --api-version 22

# アクセス先:
# 🌐 フロントエンド: http://localhost:4280
# 🔌 API: http://localhost:4280/api/articles
```

#### 個別起動
```bash
# API Functions のみ
cd api && npm run start

# Update Functions のみ
cd update-articles && npm run start
```

### 動作確認
```bash
# API動作テスト
curl http://localhost:4280/api/articles

# 手動ニュース更新テスト
curl -X POST "http://localhost:7071/api/updatearticlesmanual?limit=1"

# Cosmos DB接続テスト
cd update-articles && npx ts-node check-cosmos.ts
```

## 🚢 本番デプロイ

### 完全なAzure環境セットアップ

#### 1. インフラデプロイ
```bash
cd infrastructure/

# Cosmos DB 作成
./deploy-cosmosdb.sh \
  --subscription "your-subscription-id" \
  --resource-group "DailyAzureNewsUpdate"

# Static Web Apps 作成 (API含む)
./deploy-staticwebapp.sh \
  --subscription "your-subscription-id" \
  --resource-group "DailyAzureNewsUpdate"
```

#### 2. Update Functions デプロイ
```bash
cd update-articles

# Buildして Function App にデプロイ
npm run build
func azure functionapp publish update-articles
```

#### 3. 環境変数設定
```bash
# 本番環境の環境変数設定
az functionapp config appsettings set \
  --name "rapid-azure-digest" \
  --resource-group "DailyAzureNewsUpdate" \
  --settings \
    "COSMOS_DB_ENDPOINT=https://your-cosmos.documents.azure.com:443/" \
    "COSMOS_DB_KEY=your-cosmos-key" \
    "GROQ_API_KEY=your-groq-key"
```

### GitHub Actions CI/CD
```yaml
# .github/workflows/azure-static-web-apps.yml 自動生成
# main ブランチへのプッシュで自動デプロイ
```

## ⚙️ 環境設定

### API設定 (api/local.settings.json)
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_DB_ENDPOINT": "https://your-cosmos.documents.azure.com:443/",
    "COSMOS_DB_KEY": "your-cosmos-key",
    "COSMOS_DB_DATABASE_NAME": "NewsDatabase",
    "COSMOS_DB_CONTAINER_NAME": "Articles"
  }
}
```

### Update Functions設定 (update-articles/local.settings.json)
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_DB_ENDPOINT": "https://your-cosmos.documents.azure.com:443/",
    "COSMOS_DB_KEY": "your-cosmos-key",
    "COSMOS_DB_DATABASE_NAME": "NewsDatabase",
    "COSMOS_DB_CONTAINER_NAME": "Articles",
    "GROQ_API_KEY": "your-groq-api-key",
    "ARTICLE_RETENTION_DAYS": "30"
  }
}
```

## 🛠️ 開発コマンド

### API函数開発
```bash
cd api
npm run build          # TypeScript ビルド
npm run watch         # 監視モードビルド  
npm run start         # ローカル実行
npm run clean         # クリーンビルド
```

### データ更新函数開発
```bash
cd update-articles
npm run build          # TypeScript ビルド
npm run watch         # 監視モードビルド
npm run start         # ローカル実行
npm run clean         # クリーンビルド
```

### SWA統合開発
```bash
cd /project-root
swa start            # 統合開発環境起動
swa deploy           # 本番デプロイ
swa build            # ビルドのみ
```

### インフラ管理
```bash
cd infrastructure
./deploy-cosmosdb.sh     # DB デプロイ
./deploy-staticwebapp.sh # SWA デプロイ
```

## 📊 本番環境

### 現在のデプロイ先
- **Static Web Apps**: https://salmon-beach-0b86ff00f.4.azurestaticapps.net
- **リソースグループ**: `DailyAzureNewsUpdate`
- **リージョン**: East US 2

### 主要なAzureリソース
- **Azure Static Web Apps**: フロントエンド・API配信
- **Azure Functions** (2インスタンス): API・データ更新処理
- **Azure Cosmos DB**: ニュース記事データ保存
- **Application Insights**: ログ・監視

## 🚨 トラブルシューティング

### 本番環境でAPI 500エラーが発生する場合
**症状**: ローカルは正常、本番のみ500エラー

**解決方法**: Azure Portal → Cosmos DB → ネットワーク設定
```
✓ パブリックネットワークからのアクセスを許可する
✓ Azureサービスからのアクセスを許可する (0.0.0.0 の追加)
✓ Azure Portal からのアクセスを許可する
```

### Cosmos DB重複エラー
**症状**: 同じ記事が複数回保存されようとしてエラー
**解決方法**: 記事ID生成ロジックでURL・タイトル・ハッシュベースの複合キー使用

### Functions タイムアウト
**症状**: 大量記事処理時のタイムアウト
**解決方法**: `host.json` でタイムアウト時間調整 (現在: 10分)

### ポート競合エラー
```bash
# 使用中ポート確認
lsof -i :4280 -i :7071

# プロセス終了
lsof -t -i:4280 -i:7071 | xargs kill
```

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

1. Fork プロジェクト
2. Feature ブランチ作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Pull Request 作成

## 📚 ドキュメント

各コンポーネントの詳細な設計・運用情報は、各フォルダの README.md を参照してください:

- [api/README.md](api/README.md) - API仕様・開発ガイド
- [update-articles/README.md](update-articles/README.md) - データ更新機能ガイド  
- [frontend/README.md](frontend/README.md) - フロントエンド仕様
- [infrastructure/README.md](infrastructure/README.md) - インフラ構成・デプロイガイド
- [archive/README.md](archive/README.md) - プロジェクトドキュメント管理

## 🚀 クイックスタート

### 前提条件
- Node.js v20.0.0以上
- Azure Static Web Apps CLI v2.0.0以上
- Azure Functions Core Tools v4.6.0以上

### 初回セットアップ
```bash
# 1. リポジトリクローン
git clone <repository-url>
cd rapid-azure-digest

# 2. API依存関係インストール
cd api
npm install

# 3. 環境設定ファイル作成
cp local.settings.json.example local.settings.json
# local.settings.jsonを編集してCosmos DB接続情報を設定

# 4. API ビルド
npm run build
```

### ローカル開発実行
```bash
# SWA統合開発環境起動 (フロントエンド+API同時起動)
cd /path/to/rapid-azure-digest
swa start frontend --api-location api --api-language node --api-version 20

# アクセス先:
# 🌐 フロントエンド: http://localhost:4280
# 🔌 API: http://localhost:4280/api/articles
```

### 動作確認
```bash
# API単体テスト
curl http://localhost:4280/api/articles

# 期待される結果: 6件の記事データ取得
```

## 🚢 本番デプロイ

### Azure Static Web Apps デプロイ
```bash
# 本番環境デプロイ
swa deploy frontend --api-location api --api-language node --api-version 20 --env production

# デプロイ先: https://salmon-beach-0b86ff00f.4.azurestaticapps.net
```

## ⚙️ 環境設定

### API設定 (api/local.settings.json)
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_DB_ENDPOINT": "https://your-cosmos.documents.azure.com:443/",
    "COSMOS_DB_KEY": "your-cosmos-key",
    "COSMOS_DB_DATABASE_NAME": "NewsDatabase",
    "COSMOS_DB_CONTAINER_NAME": "Articles"
  }
}
```

## 🎯 主な機能

- **記事自動取得**: RSS フィードから Azure 関連ニュース収集
- **AI要約**: Groq API を使用した記事の自動要約
- **リアルタイム配信**: Azure Static Web Apps での高速配信
- **スケーラブル**: Azure Functions + Cosmos DB のサーバーレス構成

## 🛠️ 開発コマンド

```bash
# API開発
cd api
npm run build          # TypeScript ビルド
npm run watch         # 監視モードビルド
npm run start         # ローカル実行

# SWA統合開発
cd /project-root
swa start            # 統合開発環境起動
swa deploy           # 本番デプロイ

# データ更新
cd update-articles
npm run update-articles  # ニュース更新実行
```

## 🚨 トラブルシューティング

### 本番環境でAPI 500エラーが発生する場合
**症状**: ローカルは正常、本番のみ500エラー

**解決方法**: Azure Portal → Cosmos DB → ネットワーク設定
```
✓ パブリックネットワークからのアクセスを許可する
✓ Azureサービスからのアクセスを許可する (0.0.0.0 の追加)
✓ Azure Portal からのアクセスを許可する
```

**重要**: `0.0.0.0` の追加により、Azure Static Web Apps から Cosmos DB へのアクセスが可能になります。

### ポート競合エラー
```bash
# 使用中ポート確認
lsof -i :4280 -i :7071

# プロセス終了
lsof -t -i:4280 -i:7071 | xargs kill
```

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

1. Fork プロジェクト
2. Feature ブランチ作成 (`git checkout -b feature/AmazingFeature`)
3. コミット (`git commit -m 'Add some AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Pull Request 作成