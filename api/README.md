# API (Azure Functions)

Azure Daily News DigestのAPIサービス。Azure Functions v4で実装。

## ファイル構成

- `src/functions/articles.ts` - 記事取得API
- `package.json` - 依存関係とビルド設定
- `tsconfig.json` - TypeScript設定
- `host.json` - Azure Functions設定
- `local.settings.json` - ローカル開発用設定

## エンドポイント

### GET /api/articles
Cosmos DBから記事一覧を取得

**レスポンス:**
```json
{
  "lastUpdated": "2026-02-03T12:00:00.000Z",
  "articles": [
    {
      "id": "1",
      "title": "記事タイトル",
      "summary": "要約",
      "content": "本文",
      "url": "元記事URL",
      "date": "2026-02-03T12:00:00.000Z",
      "tags": ["Azure", "AI"]
    }
  ]
}
```

## 環境設定

`local.settings.json` または環境変数で設定：

```json
{
  "Values": {
    "COSMOS_DB_ENDPOINT": "https://your-db.documents.azure.com:443/",
    "COSMOS_DB_KEY": "your-key",
    "COSMOS_DB_DATABASE_NAME": "NewsDatabase",
    "COSMOS_DB_CONTAINER_NAME": "Articles"
  }
}
```

## ローカル開発

### 重要: Node.js バージョン要件

Azure Functions Core Tools v4 は **Node.js v20** が必要です。

```bash
# バージョン確認
node --version

# v23.x の場合、v20に切り替え
export PATH="/usr/local/opt/node@20/bin:$PATH"
```

### 開発手順

```bash
# 1. 依存関係インストール
npm install

# 2. TypeScript コンパイル
npm run build

# 3. ローカルサーバー起動
npm start

# 4. API 動作確認
curl http://localhost:7071/api/articles
```

### 開発時の注意点

- TypeScript修正後は `npm run build` でコンパイル必須
- 環境変数は `local.settings.json` または親ディレクトリの `.env` から読み込み
- デバッグログでCosmos DB接続状況を確認可能

## デプロイ

Azure Functionsにデプロイされます。