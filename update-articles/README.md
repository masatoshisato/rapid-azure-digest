# Update Articles Function

Azure Functions を使用したライブニュース更新システム。Microsoft Azure RSS から記事を取得し、AIによる日本語要約を行い、Cosmos DB に保存する自動化システムです。

## 📁 ファイル構成

```
update-articles/
├── src/
│   ├── index.ts                 # Azure Functions エントリーポイント
│   ├── functions/
│   │   ├── update-articles-manual.ts   # HTTPトリガー（手動実行）
│   │   └── update-articles-timer.ts    # タイマートリガー（自動実行）
│   └── lib/
│       ├── news-processor.ts    # RSS処理・AI要約・DB操作のメインロジック
│       └── types.ts            # TypeScript型定義・Logger
├── dist/                       # TypeScript コンパイル出力
├── data/                       # ローカル開発用データ（非本番使用）
├── host.json                   # Azure Functions ホスト設定
├── local.settings.json         # ローカル環境変数（要作成）
├── local.settings.json.example # 環境変数テンプレート
├── package.json               # Node.js 依存関係
├── tsconfig.json              # TypeScript 設定
├── check-cosmos.ts            # Cosmos DB 接続確認スクリプト
└── check-urls.ts              # RSS URL 確認スクリプト
```

## 🛠️ 技術スタック

- **Runtime**: Node.js 20.x
- **Framework**: Azure Functions v4
- **Language**: TypeScript 5.x
- **RSS Processing**: FeedParser
- **AI Translation**: Groq SDK (Llama LLM)
- **Database**: Azure Cosmos DB
- **Web Scraping**: Cheerio
- **HTTP Client**: node-fetch

## ☁️ 想定 Azure リソース

- **Azure Functions App** (Flex Consumption Plan)
- **Azure Cosmos DB** (SQL API)
- **Azure Storage Account** (Functions 実行用)
- **Application Insights** (ログ・監視)

## 📡 インターフェース仕様

### HTTP トリガー

**エンドポイント**: `POST/GET /api/updatearticlesmanual`

**認証**: Function Key 必須

**パラメーター**:
- `limit` (optional): 処理記事数上限 (default: 100)

**成功レスポンス** (200):
```json
{
  "success": true,
  "message": "ニュース更新が正常に完了しました",
  "functionName": "updateArticlesManual",
  "summary": {
    "success": true,
    "processingTimeMs": 1012,
    "rssStats": {
      "totalRssItems": 200,
      "recentRssItems": 34,
      "processedItems": 1
    },
    "articleStats": {
      "newArticles": 0,
      "skippedExisting": 1,
      "totalStoredArticles": 33
    },
    "databaseStats": {
      "cosmosDbOperations": 0,
      "successfulWrites": 0,
      "failedWrites": 0
    },
    "aiStats": {
      "groqApiCalls": 0,
      "successfulTranslations": 0
    }
  }
}
```

**エラーレスポンス** (500):
```json
{
  "success": false,
  "message": "エラーメッセージ",
  "error": {
    "name": "ErrorType",
    "message": "詳細メッセージ",
    "stack": "スタックトレース",
    "timestamp": "2026-02-11T00:00:00.000Z"
  }
}
```

### Timer トリガー

**スケジュール**: `0 0 */6 * * *` (6時間毎)

**処理**: RSS取得 → AI要約 → Cosmos DB保存 → 古い記事削除

## ⚙️ 環境変数

### 必須環境変数

```bash
# Cosmos DB 接続
COSMOS_DB_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
COSMOS_DB_KEY=your-cosmos-primary-key
COSMOS_DB_DATABASE_NAME=NewsDatabase
COSMOS_DB_CONTAINER_NAME=Articles

# AI要約サービス
GROQ_API_KEY=your_groq_api_key_here

# 記事保持設定
ARTICLE_RETENTION_DAYS=30

# Azure Functions （自動設定）
AzureWebJobsStorage=your-storage-connection-string
```

### 設定ファイル

`local.settings.json` (ローカル開発用):
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_DB_ENDPOINT": "https://your-account.documents.azure.com:443/",
    "COSMOS_DB_KEY": "your-key-here",
    "COSMOS_DB_DATABASE_NAME": "NewsDatabase",
    "COSMOS_DB_CONTAINER_NAME": "Articles",
    "GROQ_API_KEY": "your-groq-key",
    "ARTICLE_RETENTION_DAYS": "30"
  }
}
```

## 🔨 ビルド方法

```bash
# 依存関係インストール
npm install

# TypeScript コンパイル
npm run build

# 監視モード（開発時）
npm run watch
```

## 🚀 ローカル実行方法

### 1. 前提条件

- Node.js 20.x
- Azure Functions Core Tools v4
- Azure Cosmos DB インスタンス

### 2. 環境設定

```bash
# 設定ファイル作成
cp local.settings.json.example local.settings.json
# 必要な環境変数を設定
```

### 3. 実行

```bash
# ローカル Functions 起動
npm run start
# または
func start

# HTTP トリガー テスト
curl "http://localhost:7071/api/updatearticlesmanual?limit=1"
```

### 4. デバッグ

- VS Code デバッグ設定済み
- ブレークポイント対応
- ローカル Cosmos DB エミュレーター対応

## 🚢 デプロイ方法

### Azure CLI デプロイ

```bash
# ビルド
npm run build

# Azure Functions にデプロイ
func azure functionapp publish update-articles

# 環境変数設定（初回のみ）
az functionapp config appsettings set \
  --name update-articles \
  --resource-group DailyAzureNewsUpdate \
  --settings "COSMOS_DB_ENDPOINT=https://your-account.documents.azure.com:443/" \
             "COSMOS_DB_KEY=your-key" \
             "GROQ_API_KEY=your-groq-key"
```

### CI/CD デプロイ

GitHub Actions 経由でのデプロイをサポート（`.github/workflows` 設定済み）

## 🏗️ プログラム構造と主要処理仕様

### メイン処理フロー

1. **RSS 取得** (`fetchRSSFeed()`)
   - Microsoft Azure RSS を取得
   - 記事の重複チェック（URL・タイトル・ハッシュ）

2. **AI 要約** (`translateWithGroq()`)
   - Groq Llama モデルで日本語要約
   - エラー時は元のタイトル・説明を使用

3. **データ保存** (`processUpdates()`)
   - Cosmos DB への upsert 操作
   - 記事の重複防止（複合キーチェック）

4. **古い記事削除** 
   - 保持期間（ARTICLE_RETENTION_DAYS）を超えた記事を自動削除

### エラーハンドリング

- **詳細エラーログ**: スタックトレース付きエラー情報
- **リトライ機構**: AI API 失敗時の自動リトライ
- **部分エラー許容**: 一部記事の失敗でも処理継続

### パフォーマンス

- **バッチ処理**: 複数記事の一括処理
- **メモリ効率**: ストリーミング RSS パース
- **DB 最適化**: upsert による重複回避

## 📊 監視・ログ

- **Application Insights** 統合
- **構造化ログ**: JSON 形式ログ出力
- **メトリクス**: 処理時間・記事数・エラー率
- **アラート**: 実行失敗時の通知

## 🔧 開発・運用

### トラブルシューティング

```bash
# Cosmos DB 接続テスト
npx ts-node check-cosmos.ts

# RSS URL 確認
npx ts-node check-urls.ts

# ローカル実行ログ確認
func start --verbose
```

### パフォーマンスチューニング

- `ARTICLE_RETENTION_DAYS` 調整で DB サイズ管理
- Function timeout 設定（現在: 10分）
- Cosmos DB RU 設定最適化

## 📄 ライセンス

MIT License

## 🤝 コントリビュート

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request