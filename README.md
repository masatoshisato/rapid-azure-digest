# Rapid Azure Digest

Azure関連ニュースを自動収集・AI要約してWebサイト配信するフルスタックWebアプリケーションです。Azure Static Web Apps + Azure Functions + Cosmos DBの構成でクラウドネイティブに設計されています。

## 🏗️ システム構成

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▷│     API         │────▷│   Database      │
│ (Static Web)    │     │ (Azure Functions│     │   (Cosmos DB)   │
│                 │     │  TypeScript)    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 技術スタック
- **フロントエンド**: HTML5, JavaScript, CSS (Azure Static Web Apps)
- **API**: Azure Functions v4, TypeScript, Node.js 20
- **データベース**: Azure Cosmos DB (NoSQL)
- **デプロイ**: Azure Static Web Apps CLI
- **開発環境**: SWA CLI + Azure Functions Core Tools

## 📁 プロジェクト構成

```
/rapid-azure-digest/
├── frontend/              # フロントエンドアプリケーション
│   ├── index.html        # メインページ
│   ├── staticwebapp.config.json  # SWA設定
│   └── README.md         # フロントエンド詳細
├── api/                  # Azure Functions API
│   ├── src/
│   │   ├── functions/
│   │   │   ├── articles.ts    # 記事取得API
│   │   │   └── logger.ts      # ロギング機能
│   │   └── index.ts      # Function登録
│   ├── package.json      # API依存関係
│   ├── host.json         # Azure Functions設定
│   ├── local.settings.json.example  # 設定テンプレート
│   └── README.md         # API詳細
├── update-articles/        # データ更新スクリプト
│   ├── update-articles.ts  # RSS→AI要約→DB保存
│   ├── check-cosmos.ts     # DB接続確認
│   └── README.md           # データ管理詳細
├── infrastructure/       # Azure リソース定義
│   ├── cosmosdb.bicep    # Cosmos DB Bicep
│   └── staticwebapp.bicep # SWA Bicep
├── package.json          # プロジェクト設定
├── swa-cli.config.json   # SWA CLI設定
└── README.md             # このファイル
```

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