# update-news.ts ローカル実行ガイド

## 概要
`scripts/update-news.ts` は RSS フィードからニュース記事を取得し、AI で要約してから Cosmos DB に保存するスクリプトです。

## 前提条件

### 1. 環境設定
```bash
# Node.js バージョン確認
node --version  # v20.20.0 推奨

# 必要な環境変数 (.env ファイルに設定済み)
GROQ_API_KEY=your-groq-api-key  # ※要設定
COSMOS_DB_ENDPOINT=https://rapid-azure-digest-db.documents.azure.com:443/
COSMOS_DB_KEY=your-cosmos-key
COSMOS_DB_DATABASE_NAME=NewsDatabase
COSMOS_DB_CONTAINER_NAME=Articles
```

### 2. Groq API Key の取得
1. [Groq Console](https://console.groq.com/) でアカウント作成（無料）
2. API Key を生成
3. `.env` ファイルに設定:
```bash
echo "GROQ_API_KEY=your-actual-groq-api-key" >> .env
```

## 実行方法

### 標準実行
```bash
# プロジェクトルートから
cd scripts

# 依存関係のインストール（初回のみ）
npm install

# TypeScript 直接実行
npm run update-news

# または dev コマンド（同じ動作）
npm run dev
```

### ビルドして実行
```bash
# TypeScript をコンパイル
npm run build

# JavaScript で実行
npm start
```

### 環境変数の確認
```bash
# 設定済み環境変数の確認
npm run check-env

# または手動確認
echo $GROQ_API_KEY
echo $COSMOS_DB_ENDPOINT
```

## 実行結果の確認

### 1. コンソールログ
実行中に以下のログが表示されます:
```
[INFO] RSS feed parsing started
[INFO] Fetching feed from: https://example.com/rss
[INFO] Processing article: Article Title
[INFO] AI summary generated for article
[INFO] Article saved to Cosmos DB
```

### 2. Cosmos DB への保存確認
```bash
# フロントエンドで確認
npm run dev  # 別ターミナルで実行
# http://localhost:4280 でデータを確認
```

### 3. API での確認
```bash
# SWA が起動している場合
curl http://localhost:4280/api/articles

# Azure Functions のみの場合
cd api
func start
curl http://localhost:7071/api/articles
```

## トラブルシューティング

### 1. Groq API Key エラー
```bash
Error: API key not found
```
**解決方法**: `.env` ファイルに正しい API Key が設定されているか確認

### 2. Cosmos DB 接続エラー
```bash
Error: Unable to connect to Cosmos DB
```
**解決方法**: 
- ネットワーク接続を確認
- Cosmos DB のアクセスキーが正しいか確認
- Azure ポータルで Cosmos DB サービスが稼働中か確認

### 3. TypeScript 実行エラー
```bash
Error: ts-node not found
```
**解決方法**:
```bash
# scripts ディレクトリで依存関係を再インストール
npm install

# または global に ts-node をインストール
npm install -g ts-node
```

### 4. Node.js バージョンエラー
```bash
Error: Unsupported Node.js version
```
**解決方法**: 
```bash
# Node.js v20 に切り替え
nvm use 20.20.0  # nvm使用の場合
# または nodenv、n 等を使用
```

## 開発ワークフロー

### 完全なテストフロー
```bash
# 1. RSS 更新スクリプト実行
cd scripts
npm run update-news

# 2. 別ターミナルで SWA 起動
cd ..
npm run dev

# 3. ブラウザで確認
open http://localhost:4280

# 4. 新しい記事が表示されることを確認
```

### デバッグモード
`update-news.ts` にはデバッグ機能が組み込まれています:
```typescript
// Logger.setLevel(LogLevel.DEBUG); をコメントアウト
// より詳細なログが出力されます
```

## 注意事項

1. **API 制限**: Groq API の無料プランは月間制限があります
2. **実行頻度**: RSS サイトに負荷をかけないよう、適度な間隔での実行を推奨
3. **データ重複**: スクリプトは同じ記事の重複保存を防ぐ仕組みを持っています
4. **エラー処理**: 一部の RSS フィードでエラーが発生しても、他のフィードの処理は継続されます

## スクリプト構成

- **RSS 取得**: FeedParser を使用
- **AI 要約**: Groq SDK (llama3-8b-8192 モデル)
- **データ保存**: Azure Cosmos DB
- **ログ管理**: カスタム Logger クラス
- **エラー処理**: 各段階で適切なエラーハンドリング