# API (Azure Functions)

Azure Functions v4 + TypeScript で実装された記事取得APIです。Cosmos DBからニュースデータを取得してクライアントに配信します。

## 🏗️ 構成

### ファイル構成
```
api/
├── src/
│   ├── index.ts              # Function app エントリーポイント
│   └── functions/
│       ├── articles.ts       # 記事取得API実装
│       └── logger.ts         # ロギング機能
├── dist/                     # TypeScriptコンパイル出力
├── package.json              # 依存関係・スクリプト
├── tsconfig.json             # TypeScript設定
├── host.json                 # Azure Functions ホスト設定
├── local.settings.json       # ローカル開発用環境変数
└── README.md                 # このファイル
```

### 技術スタック
- **Runtime**: Node.js 20 (LTS)
- **Framework**: Azure Functions v4
- **Language**: TypeScript 5.x
- **Database**: Azure Cosmos DB SDK v4
- **Logging**: Azure Functions built-in + custom logger

## 🔌 API エンドポイント

### GET /api/articles
Cosmos DBから記事一覧を取得します。

**リクエスト**:
```http
GET /api/articles
```

**レスポンス**:
```json
{
  "lastUpdated": "2026-02-09T12:00:00.000Z",
  "totalArticles": 6,
  "articles": [
    {
      "id": "unique-id-1",
      "title": "Azure の新機能について",
      "summary": "Azure の最新アップデートに関する要約...",
      "content": "記事の完全版コンテンツ...",
      "url": "https://example.com/azure-news",
      "publishedDate": "2026-02-09T10:00:00.000Z",
      "category": "Azure",
      "tags": ["Azure", "クラウド", "新機能"],
      "source": "Microsoft Azure Blog"
    }
  ]
}
```

**レスポンス構造**:
- `lastUpdated`: 最終更新日時 (ISO 8601)
- `totalArticles`: 総記事数
- `articles`: 記事配列
  - `id`: 一意識別子
  - `title`: 記事タイトル
  - `summary`: AI生成要約
  - `content`: 記事本文 (truncated)
  - `url`: 元記事URL
  - `publishedDate`: 公開日時 (ISO 8601)
  - `category`: カテゴリ
  - `tags`: タグ配列
  - `source`: 情報源

## ⚙️ 環境設定

### ローカル開発設定
`local.settings.json` ファイルを作成：

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_DB_ENDPOINT": "https://your-cosmos.documents.azure.com:443/",
    "COSMOS_DB_KEY": "your-cosmos-primary-key",
    "COSMOS_DB_DATABASE_NAME": "NewsDatabase", 
    "COSMOS_DB_CONTAINER_NAME": "Articles"
  }
}
```

### 必要な環境変数
| 変数名 | 説明 | 例 |
|-------|------|-----|
| `COSMOS_DB_ENDPOINT` | Cosmos DB エンドポイント | `https://xxx.documents.azure.com:443/` |
| `COSMOS_DB_KEY` | Cosmos DB アクセスキー | Primary Key |
| `COSMOS_DB_DATABASE_NAME` | データベース名 | `NewsDatabase` |
| `COSMOS_DB_CONTAINER_NAME` | コンテナ名 | `Articles` |

## 🛠️ 開発・ビルド

### 初回セットアップ
```bash
cd api

# 依存関係インストール
npm install

# 環境設定
cp local.settings.json.example local.settings.json
# local.settings.json を編集

# ビルド
npm run build
```

### 開発コマンド
```bash
# TypeScript ビルド
npm run build

# 監視モード (ホットリロード)
npm run watch

# ローカル実行
npm run start
# または
func start

# クリーンビルド
npm run clean && npm run build
```

### ローカルテスト
```bash
# Functions 起動後にテスト
curl http://localhost:7071/api/articles

# 期待される結果: JSON レスポンス (6件の記事データ)
```

## 🔧 実装詳細

### CosmosDB クライアント
```typescript
import { CosmosClient } from '@azure/cosmos'

const client = new CosmosClient({
  endpoint: process.env.COSMOS_DB_ENDPOINT!,
  key: process.env.COSMOS_DB_KEY!
})
```

### エラーハンドリング
- **Cosmos DB接続エラー**: 500エラーとログ出力
- **認証エラー**: 401エラー (キー不正)
- **データ不整合**: 404エラー (コンテナ未存在)
- **一般エラー**: 500エラーと詳細ログ

### ロギング
カスタムログ機能 (`logger.ts`):
- リクエスト/レスポンスログ
- エラートラッキング
- パフォーマンス計測
- 構造化ログ出力

## 🚨 トラブルシューティング

### ローカル実行エラー
```bash
# 1. Node.js バージョン確認
node --version  # v20.x.x

# 2. Functions Core Tools 確認  
func --version  # 4.x.x

# 3. 依存関係再インストール
rm -rf node_modules package-lock.json
npm install
npm run build

# 4. 設定確認
cat local.settings.json
```

### 本番環境デバッグ
- **Application Insights** ログ確認
- **Cosmos DB メトリック** 確認
- **SWA 診断** ログ確認

### よくある問題
| 問題 | 原因 | 解決策 |
|------|------|--------|
| `Could not load function` | ビルドエラー | `npm run build` 実行 |
| `Cannot connect to Cosmos DB` | 設定エラー | 環境変数確認 |
| `403 Forbidden` | ネットワーク設定 | Cosmos DB アクセス許可設定 |

## 📦 デプロイ

### SWA CLI によるデプロイ
```bash
# プロジェクトルートから
swa deploy frontend --api-location api --api-language node --api-version 20 --env production
```

### 手動デプロイ (Azure Portal)
1. Azure Static Web Apps リソース作成
2. GitHub リポジトリ連携
3. ビルド設定: 
   - App location: `frontend`
   - API location: `api`
   - App artifact location: (空)

## 📊 パフォーマンス

### 最適化ポイント
- **コールドスタート**: 約2-3秒 (初回)
- **レスポンス時間**: 50-200ms (ウォーム状態)
- **Cosmos DB**: パーティション設計による高スループット
- **メモリ使用量**: ~128MB (Node.js 20)