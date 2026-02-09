# Frontend (Azure Static Web Apps)

Azure関連ニュースを表示するシングルページアプリケーション (SPA) です。Azure Static Web Apps でホスティングされ、Azure Functions API からデータを取得します。

## 🎨 概要

### 主な機能
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応
- **記事一覧表示**: カード形式での記事レイアウト
- **モーダル表示**: 記事詳細のポップアップ
- **リアルタイム更新**: API連携による最新データ取得
- **ローディング UI**: データ取得中の視覚的フィードバック
- **エラーハンドリング**: 接続エラー時の適切な表示

## 📁 ファイル構成

```
frontend/
├── index.html                    # メインアプリケーション
├── staticwebapp.config.json     # Azure SWA 設定
└── README.md                    # このファイル
```

## 🏗️ 技術構成

### 技術スタック
- **HTML5**: セマンティックマークアップ
- **CSS3**: Flexbox, Grid, CSS Variables, Media Queries
- **JavaScript (ES6+)**: Fetch API, DOM 操作, イベント処理
- **Azure Static Web Apps**: ホスティング・配信
- **CDN**: グローバル配信ネットワーク

### 依存関係
- **外部ライブラリ**: なし (Vanilla JavaScript)
- **API**: Azure Functions (`/api/articles`)
- **アセット**: インライン CSS/JS (単一ファイル)

## 🚀 ローカル開発

### SWA CLI 統合開発環境
```bash
# プロジェクトルートから
swa start frontend --api-location api --api-language node --api-version 20

# アクセス:
# 🌐 http://localhost:4280
```

### 単体開発 (静的サーバー)
```bash
# Node.js http-server
npx http-server frontend -p 8080

# Python
cd frontend
python -m http.server 8080

# 🌐 http://localhost:8080
```

## 📱 UI/UX 設計

### レスポンシブブレークポイント
```css
/* モバイル優先設計 */
Mobile:  320px - 768px   (デフォルト)
Tablet:  768px - 1024px  (@media min-width: 768px)
Desktop: 1024px+         (@media min-width: 1024px)
```

### カラーパレット
```css
:root {
  --primary-color: #0078d4;      /* Azure Blue */
  --secondary-color: #f3f4f6;    /* Light Gray */
  --text-primary: #1a1a1a;       /* Dark Gray */
  --text-secondary: #6b7280;     /* Medium Gray */
  --success-color: #10b981;      /* Green */
  --error-color: #ef4444;        /* Red */
  --background: #ffffff;         /* White */
}
```

### コンポーネント構成
```
┌─────────────────────────────────────────┐
│              Header                     │
│  ┌─────────────────────────────────┐    │
│  │   タイトル・更新日時表示         │    │
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│              Main Content               │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │Card1│ │Card2│ │Card3│ │Card4│      │
│  │     │ │     │ │     │ │     │      │
│  └─────┘ └─────┘ └─────┘ └─────┘      │
│                                         │
│  ┌─────┐ ┌─────┐                       │
│  │Card5│ │Card6│                       │
│  │     │ │     │                       │
│  └─────┘ └─────┘                       │
├─────────────────────────────────────────┤
│              Footer                     │
│  Last Updated: 2026-02-09 12:00:00     │
└─────────────────────────────────────────┘
```

## 🔌 API 連携

### エンドポイント
```javascript
// 本番環境
const API_URL = '/api/articles'

// ローカル開発 (SWA CLI)
const API_URL = '/api/articles'  // プロキシ経由
```

### データフロー
```javascript
// API呼び出し
fetch('/api/articles')
  .then(response => response.json())
  .then(data => {
    updateLastUpdatedTime(data.lastUpdated);
    renderArticles(data.articles);
  })
  .catch(error => {
    showErrorMessage('データの取得に失敗しました');
  });
```

### エラーハンドリング
```javascript
// 接続エラー
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}

// データ形式エラー
if (!data.articles || !Array.isArray(data.articles)) {
  throw new Error('Invalid data format');
}
```

## 🎯 主要機能実装

### 1. 記事カード表示
```javascript
function createArticleCard(article) {
  return `
    <article class="article-card" data-id="${article.id}">
      <h3>${escapeHtml(article.title)}</h3>
      <p class="summary">${escapeHtml(article.summary)}</p>
      <div class="metadata">
        <span class="date">${formatDate(article.publishedDate)}</span>
        <span class="source">${escapeHtml(article.source)}</span>
      </div>
    </article>
  `;
}
```

### 2. モーダル表示
```javascript
function showModal(article) {
  const modal = document.getElementById('modal');
  const content = modal.querySelector('.modal-content');
  
  content.innerHTML = `
    <h2>${escapeHtml(article.title)}</h2>
    <div class="article-content">
      ${escapeHtml(article.content)}
    </div>
    <a href="${article.url}" target="_blank">元記事を読む</a>
  `;
  
  modal.classList.add('active');
}
```

### 3. ローディング状態
```javascript
function showLoading() {
  const container = document.getElementById('articles-container');
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>記事を取得中...</p>
    </div>
  `;
}
```

## 🔧 設定ファイル

### staticwebapp.config.json
```json
{
  "platform": {
    "apiRuntime": "node:20"
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "mimeTypes": {
    ".json": "application/json"
  }
}
```

## 📊 パフォーマンス最適化

### Webサイト最適化
- **CSSインライン化**: HTTPリクエスト削減
- **JavaScriptインライン化**: 初期表示高速化
- **画像最適化**: 現在は未使用 (テキストのみ)
- **Gzip圧縮**: Azure SWA 自動対応
- **CDN配信**: グローバルエッジ配信

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms  
- **CLS** (Cumulative Layout Shift): < 0.1

### ブラウザサポート
- **Chrome**: 88+
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+

## 🚨 トラブルシューティング

### よくある問題

| 問題 | 症状 | 解決策 |
|------|------|--------|
| API接続エラー | 「データ取得失敗」表示 | コンソールでネットワークタブ確認 |
| 表示レイアウト崩れ | CSSスタイル適用されない | ブラウザキャッシュクリア |
| モーダル動作不良 | ポップアップ表示されない | JavaScript エラーコンソール確認 |

### デバッグ方法
```javascript
// ブラウザコンソールでAPI確認
fetch('/api/articles')
  .then(r => r.json())
  .then(console.log);

// ローカルストレージ確認
console.log(localStorage);

// DOM要素確認
console.log(document.getElementById('articles-container'));
```

## 🚀 デプロイ

### Azure Static Web Apps
```bash
# SWA CLI でデプロイ
swa deploy frontend --api-location api --api-language node --api-version 20 --env production

# デプロイ先確認
# https://salmon-beach-0b86ff00f.4.azurestaticapps.net
```

### 本番環境URL
- **プロダクション**: https://salmon-beach-0b86ff00f.4.azurestaticapps.net

## 🔄 今後の改善予定

### 機能拡張
- [ ] 記事検索機能
- [ ] カテゴリフィルター
- [ ] ページネーション
- [ ] お気に入り機能
- [ ] ソーシャルシェア

### パフォーマンス改善
- [ ] Service Worker 実装 (PWA化)
- [ ] 画像遅延読み込み
- [ ] 仮想スクロール (大量データ)
- [ ] キャッシング戦略