# Azure News Digest 📰

AI翻訳によるAzure RSSニュースの日本語配信サービス。Azure Static Web Appsでホスティング。

[![GitHub Actions](https://github.com/masatoshisato/rapid-azure-digest/workflows/Daily%20Azure%20News%20Update/badge.svg)](https://github.com/masatoshisato/rapid-azure-digest/actions)
[![Azure Static Web Apps](https://img.shields.io/badge/Azure-Static%20Web%20Apps-blue?logo=microsoft-azure)](https://salmon-beach-0b86ff00f.4.azurestaticapps.net)

## 🌐 デモサイト

**本番環境**: https://salmon-beach-0b86ff00f.4.azurestaticapps.net

## 🎯 主要機能

### 🤖 AI翻訳・要約システム
- **RSS フィード解析**: Microsoft Azure Updates の RSS を自動取得
- **AI 翻訳・要約**: 高精度な日本語翻訳（Groq SDK + llama-3.3-70b-versatile）
- **技術タグ抽出**: Azure サービス名・技術名の自動識別
- **リンク抽出**: 関連ドキュメントリンクの自動収集

### 🌐 Modern Web Interface
- **レスポンシブデザイン**: モバイル・デスクトップ対応
- **検索機能**: ファジー検索（Fuse.js）によるリアルタイム検索
- **モーダル表示**: 記事詳細のポップアップ表示
- **最新順表示**: 新しい記事が先頭に自動ソート

### ⚡ 自動化 & インフラストラクチャ
- **Azure Static Web Apps**: 高速で安全なホスティング
- **GitHub Actions**: 毎日自動更新（午前0時 JST）
- **Infrastructure as Code**: Bicep テンプレートによるインフラ管理
- **CI/CD**: 自動テスト・ビルド・デプロイ

## 🚀 クイックスタート

### デモサイトへアクセス
1. **本番サイト**: https://salmon-beach-0b86ff00f.4.azurestaticapps.net
2. 最新のAzureニュースを日本語で確認
3. 検索バーでキーワード検索
4. 記事をクリックして詳細表示

### ローカル開発環境

#### 前提条件
- Node.js 20+ (LTS推奨)
- TypeScript
- Groq API キー

#### セットアップ
```bash
# リポジトリをクローン
git clone https://github.com/masatoshisato/rapid-azure-digest.git
cd rapid-azure-digest

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env
# .env ファイルに GROQ_API_KEY を設定
```

#### 環境変数
```bash
GROQ_API_KEY=your_groq_api_key_here
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