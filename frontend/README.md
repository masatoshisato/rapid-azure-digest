# Frontend

Azure Daily News Digestのフロントエンドアプリケーション。

## ファイル構成

- `index.html` - メインのHTML画面
- CSSファイル等の静的アセット

## 機能

- Azure関連ニュースの表示
- APIからの記事取得
- レスポンシブデザイン

## ローカル開発

Azure Static Web Apps CLIまたはライブサーバーで起動：

```bash
# SWA CLI使用（推奨）
swa start frontend --api-location ../api

# または simple HTTP server
cd frontend
python3 -m http.server 8080
```

## デプロイ

Azure Static Web Apps にデプロイされます。