# Azure Updates RSS Processor

Microsoft Azure Updates RSSフィードを自動処理し、日本語翻訳・技術タグ抽出・リンク収集を行う TypeScript アプリケーション。

## 🎯 主要機能

- **RSS フィード解析**: Microsoft Azure Updates の RSS を自動取得
- **AI 翻訳**: 高精度な日本語翻訳（Groq SDK + llama-3.3-70b-versatile 使用）
- **技術タグ抽出**: Azure サービス名・技術名の自動識別
- **リンク収集**: 関連ドキュメントリンクの自動抽出
- **データ管理**: 重複除去・365日保持・JSON形式保存

## 🚀 セットアップ

### 前提条件

- Node.js 18+ 
- TypeScript
- Groq API キー

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/[username]/rapid-azure-digest.git
cd rapid-azure-digest

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env
# .env ファイルに GROQ_API_KEY を設定
```

### 環境変数

```bash
GROQ_API_KEY=your_groq_api_key_here
```

## 📖 使用方法

### 基本実行

```bash
# 全記事を処理
npm run update-news

# 制限付き処理（テスト用）
npm run update-news 5
```

### 出力

処理結果は `data/news.json` に保存されます：

```json
{
  "lastUpdated": "2026-01-31T09:03:51.690Z",
  "articles": [
    {
      "title": "Retirement: Support for Python 3.10 ends on October 1, 2026",
      "link": "https://azure.microsoft.com/updates?id=545771",
      "description": "In alignment with the end of community support...",
      "japaneseTitle": "廃止: Python 3.10 のサポートは 2026 年 10 月 1 日に終了",
      "japaneseDescription": "コミュニティのサポート終了に伴い...",
      "technicalTags": ["Python 3.10", "Python 3.13", "Azure Functions"],
      "extractedLinks": [],
      "date": "2026-01-28T23:15:47.000Z"
    }
  ]
}
```

## 🏗️ アーキテクチャ

### ディレクトリ構成

```
rapid-azure-digest/
├── scripts/
│   └── update-news.ts    # メインプログラム
├── data/
│   └── news.json         # 出力JSONデータ
├── package.json          # 依存関係定義
└── tsconfig.json         # TypeScript設定
```

### 主要な技術

- **RSS解析**: feedparser + node-fetch
- **AI翻訳**: Groq SDK (llama-3.3-70b-versatile)
- **ウェブスクレイピング**: axios + cheerio
- **言語**: TypeScript + Node.js

## 🔧 機能詳細

### コンテンツ補完

RSS フィードの255文字制限を AI の推論能力で補完：

- タイトルと部分コンテンツから全体像を推測
- Azure エコシステムの知識を活用した論理的補完
- 一貫性のある日本語翻訳

### データ管理

- **365日自動保持**: 古いデータの自動削除
- **重複除去**: URL ベースの重複チェック
- **エラーハンドリング**: ネットワークエラーや API 制限への対応

## 📅 自動化

GitHub Actions での定期実行が可能：

```yaml
# .github/workflows/update-news.yml での自動実行例
- name: Update Azure News
  run: npm run update-news
```

## 🤝 コントリビューション

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 ライセンス

This project is licensed under the MIT License.

## 🙏 謝辞

- Microsoft Azure Updates RSS フィード
- Groq AI API
- Node.js コミュニティ