# Azure Daily News Digest 📰

AI要約によるAzure RSSニュースの配信サービス。Azure Static Web Apps + Azure Functions + Cosmos DB で構築。

[![GitHub Actions](https://github.com/masatoshisato/rapid-azure-digest/workflows/Daily%20Azure%20News%20Update/badge.svg)](https://github.com/masatoshisato/rapid-azure-digest/actions)
[![Azure Static Web Apps](https://img.shields.io/badge/Azure-Static%20Web%20Apps-blue?logo=microsoft-azure)](https://salmon-beach-0b86ff00f.4.azurestaticapps.net)

## 🌐 デモサイト

**本番環境**: https://salmon-beach-0b86ff00f.4.azurestaticapps.net

## 📁 プロジェクト構成

```
rapid-azure-digest/
├── README.md                     # このファイル
├── .env                          # 環境変数（共通）
├── package.json                  # ワークスペース設定
├── frontend/                     # フロントエンド
│   ├── index.html               # メインアプリケーション
│   └── README.md                # フロントエンド説明書
├── api/                          # Azure Functions API
│   ├── src/functions/
│   │   └── articles.ts          # 記事取得API
│   ├── package.json
│   ├── tsconfig.json
│   ├── host.json
│   ├── local.settings.json
│   └── README.md                # API説明書
├── scripts/                      # 自動化スクリプト
│   ├── update-news.ts           # RSS取得・AI要約・DB保存
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md                # スクリプト説明書
└── .github/workflows/            # CI/CD設定
    └── update-news.yml          # 毎日のニュース更新
```

## 🎯 主要機能

### 🤖 AI要約・分析システム
- **RSS フィード解析**: Microsoft Azure関連のRSSを自動取得
- **AI 要約**: Groq SDK (llama-3.3-70b-versatile) による高精度な日本語要約
- **重複除去**: タイトル・URL・日付による重複チェック
- **Cosmos DB保存**: NoSQLデータベースでの永続化

### 🌐 Modern Web Interface
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **REST API連携**: Azure Functions経由でのデータ取得
- **リアルタイム表示**: 最新記事の自動表示
- **モーダル表示**: 記事詳細のポップアップ

### ⚡ Azure インフラストラクチャ
- **Azure Static Web Apps**: フロントエンドホスティング
- **Azure Functions**: サーバーレスAPI
- **Azure Cosmos DB**: NoSQLデータベース
- **GitHub Actions**: 毎日自動更新（午前0時 JST）

## 🚀 クイックスタート

## 🚀 クイックスタート

### 前提条件
- Node.js 20+ (LTS推奨)
- Azure アカウント
- Groq API キー

### 環境設定
```bash
# リポジトリをクローン
git clone https://github.com/masatoshisato/rapid-azure-digest.git
cd rapid-azure-digest

# 環境変数を設定
cp .env.example .env
# .env ファイルにAPIキーとAzureリソース情報を設定

# ワークスペースの依存関係をインストール
npm run install-all
```

### ローカル開発

### ローカル開発

#### 重要: Node.js バージョン設定

**Azure Functions Core Tools v4はNode.js v20が必須です**

**自動化（推奨）:**
```bash
# プロジェクトに含まれる自動化スクリプトを使用
npm run dev  # 自動的にNode.js v20を使用してSWA起動
```

**手動設定:**
```bash
# 現在のNode.jsバージョンを確認
node --version

# Node.js v23.x の場合、v20に切り替えが必要
export PATH="/usr/local/opt/node@20/bin:$PATH"

# バージョン切り替えを確認
node --version  # v20.x.x が表示されるはず
```

**📁 含まれる設定ファイル:**
- `.nvmrc`: Node.js v20指定
- `dev.sh`: Node.js v20自動設定スクリプト

## 📰 RSS Update Script (scripts/update-news.ts) ローカル実行

### 前提条件
- Groq API Key (無料アカウント作成可能)
- Node.js v20.20.0
- Cosmos DB アクセスキー

### 実行方法

1. **環境変数の設定**
```bash
# .env ファイルに以下を追加 (他は設定済み)
GROQ_API_KEY=your-groq-api-key-here
```

2. **スクリプトの実行**
```bash
# scripts ディレクトリに移動
cd scripts

# 依存関係のインストール (初回のみ)
npm install

# TypeScript 直接実行
npm run update-news

# または、コンパイルしてから実行
npm run build
npm start
```

3. **実行結果の確認**
- コンソールに RSS 処理とAI要約のログが表示されます
- Cosmos DB に記事データが保存されます
- フロントエンド (http://localhost:4280) で新しい記事を確認できます

### トラブルシューティング

#### Groq API Key エラー
```bash
# .env ファイルを確認
cat .env | grep GROQ

# 正しくない場合は設定
echo "GROQ_API_KEY=your-actual-key" >> .env
```

#### TypeScript 実行エラー
```bash
# scripts ディレクトリで再インストール
cd scripts
npm install

# または ts-node をグローバルインストール
npm install -g ts-node
```

**永続的な設定（推奨）**

毎回の設定を避けるため、`.zshrc` または `.bash_profile` に追加：

```bash
# ~/.zshrc または ~/.bash_profile に追加
export PATH="/usr/local/opt/node@20/bin:$PATH"

# 設定を再読み込み
source ~/.zshrc
```

#### フロントエンド + API の起動

**方法1: 統合開発サーバー（推奨）**
```bash
# Node.js 20に設定済みの状態で
cd /Users/sato/proj/rapid-azure-digest
npm run dev

# 起動成功メッセージ
# "Azure Static Web Apps emulator started at http://localhost:4280"
# "Mapped function route 'api/articles' [GET] to 'articles'"
```

**アクセス先:**
- フロントエンド: http://localhost:4280
- API: http://localhost:4280/api/articles

**方法2: 個別起動**
```bash
# ターミナル1: API サーバー
export PATH="/usr/local/opt/node@20/bin:$PATH"
cd api
npm start

# ターミナル2: フロントエンド（別ターミナル）
cd frontend
python3 -m http.server 8080
```

#### トラブルシューティング

**エラー: "Found Azure Functions Core Tools v4 which is incompatible"**

```bash
# Node.jsバージョン確認
node --version

# v23.x の場合は v20 に切り替え
export PATH="/usr/local/opt/node@20/bin:$PATH"

# 再度起動
npm run dev
```

**エラー: "package.json parse error"**

```bash
# package.jsonの構文確認
cat package.json | jq .

# 依存関係の再インストール
npm install
```

**API接続エラー**

```bash
# API動作確認
curl -s http://localhost:4280/api/articles

# デバッグログでCosmos DB接続確認
# サーバーログでDEBUGメッセージを確認
```

#### 開発ワークフロー

1. **環境設定**
   ```bash
   export PATH="/usr/local/opt/node@20/bin:$PATH"
   cd /Users/sato/proj/rapid-azure-digest
   ```

2. **サーバー起動**
   ```bash
   npm run dev
   ```

3. **開発確認**
   ```bash
   # 新しいターミナルで
   curl -s http://localhost:4280/api/articles | jq
   open http://localhost:4280
   ```

4. **コード修正後の再コンパイル**
   ```bash
   # API修正時
   cd api && npm run build
   
   # ブラウザで確認
   # サーバー再起動は不要（ホットリロード）
   ```

#### ニュース更新スクリプト
```bash
# デフォルト実行
npm run update-news

# 個別実行
cd scripts
npm run update-news
```

### 環境変数

`.env` ファイルに以下を設定：

```bash
# Groq API（AI要約用）
GROQ_API_KEY=your_groq_api_key_here

# Azure Cosmos DB
COSMOS_DB_ENDPOINT=https://your-db.documents.azure.com:443/
COSMOS_DB_KEY=your_cosmos_db_key
COSMOS_DB_DATABASE_NAME=NewsDatabase
COSMOS_DB_CONTAINER_NAME=Articles

# Azure認証（オプション）
AZURE_SUBSCRIPTION_ID=your_subscription_id
AZURE_TENANT_ID=your_tenant_id
```

## 📖 使用方法

### ニュースデータ更新
```bash
# デフォルト（推奨）- 100件制限でRate limit対策
npm run update-news

# 全記事を処理（Rate limitリスク有り）
npm run update-news:all

# デバッグログ付き（100件制限）
npm run update-news:debug

# カスタム件数指定
npx tsx scripts/update-news.ts 50

# 詳細オプション
npx tsx scripts/update-news.ts --help
```

> 💡 **Rate Limit対策**: デフォルトでは100件制限を適用してGroq APIの制限を回避します。空のnews.jsonから開始する場合は特に重要です。

### 静的サイトの確認
```bash
# ローカルサーバー起動
npx http-server . -p 3000
# http://localhost:3000 でアクセス
```
### データ出力例

処理結果は `data/news.json` に保存されます：

```json
{
  "lastUpdated": "2026-02-02T12:00:00.000Z",
  "articles": [
    {
      "title": "General availability: Azure Functions supports Python 3.13",
      "link": "https://azure.microsoft.com/updates/...",
      "description": "Azure Functions now supports Python 3.13...",
      "japaneseTitle": "一般提供開始: Azure Functions が Python 3.13 をサポート",
      "japaneseDescription": "Azure Functions が Python 3.13 をサポートするようになりました...",
      "technicalTags": ["Azure Functions", "Python 3.13", "サーバーレス"],
      "extractedLinks": ["https://docs.microsoft.com/azure/functions/"],
      "date": "2026-02-02T09:00:00.000Z"
    }
  ]
}
```

## 🏗️ アーキテクチャ

### プロジェクト構造
```
rapid-azure-digest/
├── 🌐 フロントエンド
│   ├── index.html              # メインWebページ
│   └── data/
│       └── news.json          # ニュースデータ
├── 🤖 バックエンド処理
│   └── scripts/
│       └── update-news.ts     # RSS処理・AI翻訳
├── ☁️ インフラストラクチャ
│   └── infrastructure/
│       ├── staticwebapp.bicep      # Azure SWA定義
│       ├── staticwebapp.parameters.json
│       └── deploy-staticwebapp.sh  # デプロイスクリプト
├── 🔄 CI/CD
│   └── .github/workflows/
│       └── daily-azure-news.yml   # 自動更新ワークフロー
└── 📚 ドキュメント
    └── docs/                   # デプロイガイド等
```

### 技術スタック

#### フロントエンド
- **HTML5 + CSS3**: セマンティックマークアップ
- **Tailwind CSS**: レスポンシブデザイン
- **Vanilla JavaScript**: 軽量でモダンなUI
- **Fuse.js**: ファジー検索エンジン

#### バックエンド・処理
- **Node.js 20 (LTS)**: ランタイム環境
- **TypeScript**: 型安全な開発
- **Groq SDK**: AI翻訳・要約API
- **Feedparser**: RSS解析

#### インフラストラクチャ
- **Azure Static Web Apps**: ホスティング（無料枠）
- **Bicep**: Infrastructure as Code
- **GitHub Actions**: CI/CD自動化

## 🔄 自動化システム

### GitHub Actions ワークフロー

**毎日午前0時（JST）に自動実行**:

```yaml
name: Daily Azure News Update

on:
  schedule:
    - cron: '0 15 * * *'  # 15:00 UTC = 0:00 JST
  workflow_dispatch:      # 手動実行も可能

jobs:
  update-azure-news:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npx tsx scripts/update-news.ts
      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
```

### 自動化フロー

```
毎日午前0時 →
├── RSS取得・解析（最大100件）
├── AI翻訳・要約（Rate limit対策）
├── データ更新検知
└── 変更あり → SWAに自動デプロイ → 本番サイト更新
```

### Rate Limit対策 🛡️

システムは**100件制限**を適用して、Groq APIの制限を自動回避します：

| 実行方法 | 処理件数 | 推奨用途 |
|---------|---------|----------|
| `npm run update-news` | 100件 | **日次運用（推奨）** |
| `npm run update-news:all` | 全件 | 初回セットアップ |
| `npm run update-news:debug` | 100件 | 開発・デバッグ |

**空のnews.jsonから開始する場合**:
```bash
# 1. 最初の100件を安全に処理
npm run update-news

# 2. 必要に応じて追加実行
npm run update-news

# 3. すべてのデータが必要な場合（注意が必要）
npm run update-news:all
```

### セットアップ手順

1. **GitHub Secrets 設定**:
   ```
   GROQ_API_KEY: Groq AI APIキー
   AZURE_STATIC_WEB_APPS_API_TOKEN: SWAデプロイトークン
   ```

2. **自動実行確認**:
   - GitHub Actions タブで実行状況を確認
   - 手動実行も「Run workflow」で可能

## 🌐 Azure Static Web Apps デプロイ

### 本番環境情報

- **URL**: https://salmon-beach-0b86ff00f.4.azurestaticapps.net
- **リソース**: `rapid-azure-digest`
- **リソースグループ**: `DailyAzureNewsUpdate`
- **リージョン**: East US 2
- **プラン**: Free

### インフラストラクチャ管理

#### Bicepテンプレートでデプロイ
```bash
cd infrastructure
./deploy-staticwebapp.sh \
  --subscription "YOUR_SUBSCRIPTION_ID" \
  --resource-group "DailyAzureNewsUpdate" \
  --location "eastus2"
```

#### 手動デプロイ
```bash
swa deploy \
  --resource-group "DailyAzureNewsUpdate" \
  --app-name "rapid-azure-digest" \
  --app-location "./deploy-temp" \
  --env production
```

詳細なデプロイ手順: [docs/swa-deployment-guide.md](docs/swa-deployment-guide.md)

## 🔧 開発・カスタマイズ

### ローカル開発

1. **ニュースデータ更新**:
   ```bash
   npm run update-news 3  # 3件のみテスト実行
   ```

2. **Webサイト確認**:
   ```bash
   npx http-server . -p 8080
   # http://localhost:8080 でアクセス
   ```

### 設定のカスタマイズ

#### AI翻訳モデル変更
`scripts/update-news.ts` の Groq 設定を修正:

```typescript
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// モデル変更
model: "llama-3.3-70b-versatile"  // 他のモデルに変更可能
```

#### フィルタリング設定
```typescript
// 365日保持期間の変更
cutoffDate.setDate(cutoffDate.getDate() - 365);  // 日数変更可能
```

## 🤝 コントリビューション

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 開発ガイドライン

- **コード品質**: TypeScript strict mode使用
- **コミットメッセージ**: [Conventional Commits](https://www.conventionalcommits.org/) 形式
- **テスト**: 新機能追加時は動作確認必須

## 📊 パフォーマンス・制限

### API制限
- **Groq API**: レート制限あり（3秒間隔で実行）
- **Azure SWA**: 無料枠 100GB/月転送量

### 最適化
- **データサイズ**: JSON圧縮、不要ファイル除外
- **レスポンス**: CDN配信、Gzip圧縮
- **検索**: インデックス型検索、クライアントサイド処理

## 📝 ライセンス

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 謝辞

- **Microsoft Azure**: RSS フィード提供
- **Groq**: AI翻訳・要約API
- **GitHub**: Actions・ホスティング
- **Tailwind CSS**: UIフレームワーク
- **Fuse.js**: 検索エンジンライブラリ

## 🔗 関連リンク

- [Azure Static Web Apps ドキュメント](https://docs.microsoft.com/azure/static-web-apps/)
- [Groq API ドキュメント](https://groq.com/)
- [GitHub Actions ドキュメント](https://docs.github.com/actions)
- [デプロイガイド](docs/swa-deployment-guide.md)

---

最終更新: 2026年2月2日