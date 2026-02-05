# Scripts

GitHub ActionsやCI/CDで実行されるスクリプト群。

## ファイル構成

- `update-news.ts` - RSSから記事を取得してCosmos DBに保存
- `check-workflow-result.sh` - ワークフロー結果確認スクリプト
- `package.json` - 依存関係
- `tsconfig.json` - TypeScript設定

## update-news.ts

### 機能
1. 複数のRSSフィードから記事を取得
2. Groq APIを使用して記事を要約
3. 重複チェック後、Cosmos DBに保存

### 実行方法

```bash
# ローカル実行
npm run update-news

# GitHub Actions での実行
# .github/workflows/update-news.yml で自動実行
```

### 環境変数

以下の環境変数が必要：

```bash
GROQ_API_KEY=your-groq-api-key
COSMOS_DB_ENDPOINT=https://your-db.documents.azure.com:443/
COSMOS_DB_KEY=your-cosmos-key
COSMOS_DB_DATABASE_NAME=NewsDatabase
COSMOS_DB_CONTAINER_NAME=Articles
```

### RSS ソース

現在以下のフィードを監視：
- Microsoft Azure Blog
- Azure Updates
- その他のAzure関連ブログ

## スケジュール

GitHub Actionsで定期実行（cron設定で制御）