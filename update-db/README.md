# Update-DB - 自動化スクリプト

ニュース更新・データチェック・運用監視のための自動化スクリプト群です。GitHub ActionsやローカルCLIから実行可能です。

## 📁 ファイル構成

```
update-db/
├── update-news.ts          # メインスクリプト: RSS→AI要約→DB保存
├── check-cosmos.ts         # Cosmos DB 接続・データ確認
├── check-urls.ts           # URL有効性チェック
├── check-workflow-result.sh # GitHub Actions 結果確認
├── package.json            # 依存関係・実行スクリプト
├── tsconfig.json           # TypeScript コンパイル設定
├── data/
│   └── news.json          # RSS フィード設定
└── README.md              # このファイル
```

## 🚀 主要スクリプト

### 1. update-news.ts - ニュース更新エンジン

**機能**:
- 複数RSS フィードから Azure関連記事を自動取得
- Groq APIによる高精度AI要約 (日本語)
- 重複除去とデータ整合性チェック
- Azure Cosmos DB への安全な保存

**実行方法**:
```bash
cd scripts

# 依存関係インストール
npm install

# 環境変数設定
export GROQ_API_KEY="your-groq-api-key"
export COSMOS_DB_ENDPOINT="https://your-cosmos.documents.azure.com:443/"
export COSMOS_DB_KEY="your-cosmos-key"
export COSMOS_DB_DATABASE_NAME="NewsDatabase"
export COSMOS_DB_CONTAINER_NAME="Articles"

# スクリプト実行
npm run update-news
```

**処理フロー**:
```
RSS取得 → 記事解析 → AI要約 → 重複チェック → DB保存 → ログ出力
```

**設定ファイル** (`data/news.json`):
```json
{
  "sources": [
    {
      "name": "Azure Blog",
      "url": "https://azure.microsoft.com/en-us/blog/feed/",
      "category": "Official"
    },
    {
      "name": "Azure Updates",
      "url": "https://azure.microsoft.com/en-us/updates/feed/",
      "category": "Updates"
    }
  ]
}
```

**ログ例**:
```
🔄 RSS フィード取得開始...
📰 Azure Blog から 15 件の記事を取得
📰 Azure Updates から 8 件の記事を取得
🤖 AI要約処理: 23/23 件完了
🗃️ Cosmos DB 保存: 6 件 (重複除去: 17 件)
✅ ニュース更新完了 (実行時間: 45.2秒)
```

### 2. check-cosmos.ts - DB状態確認

**機能**:
- Cosmos DB 接続テスト
- データ件数・構造確認
- 最新記事の取得日時確認

**実行方法**:
```bash
npm run check-cosmos
```

**出力例**:
```
✅ Cosmos DB 接続成功
📊 総記事数: 6 件
🕒 最新記事: 2026-02-09T12:00:00.000Z
💾 データベース: NewsDatabase
📄 コンテナ: Articles
```

### 3. check-urls.ts - URL有効性チェック

**機能**:
- DB内記事URLの生存確認
- HTTPステータスコード検証
- リンク切れレポート生成

**実行方法**:
```bash
npm run check-urls
```

### 4. check-workflow-result.sh - GitHub Actions監視

**機能**:
- 最新ワークフロー実行結果確認
- 失敗時のアラート
- ログ出力とステータス取得

**実行方法**:
```bash
./check-workflow-result.sh
```

## ⚙️ 環境設定

### 必要な環境変数
```bash
# Groq API (AI要約用)
GROQ_API_KEY=your-groq-api-key

# Azure Cosmos DB
COSMOS_DB_ENDPOINT=https://your-cosmos.documents.azure.com:443/
COSMOS_DB_KEY=your-cosmos-primary-key
COSMOS_DB_DATABASE_NAME=NewsDatabase
COSMOS_DB_CONTAINER_NAME=Articles
```

### Groq API キー取得
1. [Groq Console](https://console.groq.com/) でアカウント作成（無料）
2. API Key を生成 (月間制限: 6,000リクエスト/無料)
3. 環境変数に設定

### Azure Cosmos DB設定
1. Azure Portal → Cosmos DB → キー
2. プライマリキーとエンドポイントを取得
3. データベース・コンテナ名を確認

## 🤖 AI要約システム

### Groq API設定
```typescript
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const completion = await groq.chat.completions.create({
  messages: [
    {
      role: "system",
      content: "Azure関連記事を200文字程度の日本語で要約してください"
    },
    {
      role: "user", 
      content: article.content
    }
  ],
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
  max_tokens: 300
});
```

### 要約品質基準
- **文字数**: 150-250文字
- **言語**: 日本語
- **内容**: 技術的な正確性重視
- **形式**: 読みやすい文章構造

## 📅 自動実行設定 (GitHub Actions)

### ワークフロー設定 (.github/workflows/update-news.yml)
```yml
name: Daily Azure News Update
on:
  schedule:
    - cron: '0 15 * * *'  # 毎日午前0時 JST
  workflow_dispatch:

jobs:
  update-news:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd update-db && npm install
      - run: cd update-db && npm run update-news
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
          COSMOS_DB_ENDPOINT: ${{ secrets.COSMOS_DB_ENDPOINT }}
          COSMOS_DB_KEY: ${{ secrets.COSMOS_DB_KEY }}
          COSMOS_DB_DATABASE_NAME: ${{ secrets.COSMOS_DB_DATABASE_NAME }}
          COSMOS_DB_CONTAINER_NAME: ${{ secrets.COSMOS_DB_CONTAINER_NAME }}
```

### GitHub Secrets設定
```
Repository Settings → Secrets and variables → Actions

必要なSecrets:
- GROQ_API_KEY
- COSMOS_DB_ENDPOINT  
- COSMOS_DB_KEY
- COSMOS_DB_DATABASE_NAME
- COSMOS_DB_CONTAINER_NAME
```

## 🛠️ 開発・デバッグ

### セットアップ
```bash
cd scripts

# 依存関係インストール
npm install

# TypeScript ビルド
npx tsc

# ローカル実行
npm run update-news
```

### デバッグモード
```typescript
// update-news.ts でデバッグログ有効化
const DEBUG = true;

if (DEBUG) {
  console.log('デバッグ: RSS データ', rssData);
  console.log('デバッグ: AI要約結果', summary);
}
```

### トラブルシューティング
```bash
# よくある問題解決

# 1. TypeScript コンパイルエラー
npx tsc --noEmit  # 構文チェック

# 2. Groq API エラー
curl -H "Authorization: Bearer $GROQ_API_KEY" https://api.groq.com/v1/models

# 3. Cosmos DB 接続エラー  
npm run check-cosmos

# 4. RSS取得エラー
curl -I "https://azure.microsoft.com/en-us/blog/feed/"
```

## 📊 監視・ログ

### 実行ログ例
```
2026-02-09 12:00:00 [INFO] ニュース更新開始
2026-02-09 12:00:05 [INFO] RSS取得完了: 23件
2026-02-09 12:00:30 [INFO] AI要約完了: 23/23件
2026-02-09 12:00:35 [INFO] DB保存完了: 6件 (新規)
2026-02-09 12:00:36 [INFO] 実行時間: 36.2秒
```

### エラー監視
- **RSS取得失敗**: HTTP 4xx/5xx エラー
- **AI要約エラー**: Groq API制限・エラー
- **DB保存エラー**: Cosmos DB接続・認証エラー
- **重複エラー**: データ整合性チェック失敗

## 🔄 今後の改善予定

### 機能拡張
- [ ] 複数言語対応 (英語要約)
- [ ] 記事カテゴリ自動分類
- [ ] トレンド分析・キーワード抽出
- [ ] Slack/Teams 通知連携

### 運用改善  
- [ ] エラー通知システム
- [ ] パフォーマンス監視
- [ ] データ品質チェック
- [ ] 自動テスト追加