# ローカル開発クイックリファレンス

## 🚨 起動前の必須チェック

### Node.js バージョン確認・切り替え

**自動化スクリプト (推奨):**
```bash
# プロジェクトルートに .nvmrc と dev.sh が自動的にNode.js v20を使用
npm run dev  # 自動的にv20を使用して起動
```

**手動での確認・切り替え:**
```bash
# 現在のバージョン確認
node --version

# ❌ v23.x.x が表示された場合
export PATH="/usr/local/opt/node@20/bin:$PATH"

# ✅ v20.x.x が表示されればOK
node --version
```

### 📁 プロジェクトに含まれる設定ファイル

- **`.nvmrc`**: Node.js v20を指定（nvmサポート用）
- **`dev.sh`**: Node.js v20を自動設定してSWA起動
- **`package.json`**: devスクリプトがdev.shを実行

## 🚀 起動手順

### 1. ワンコマンド起動（推奨）

```bash
# プロジェクトルートで（Node.js v20自動使用）
npm run dev
```

**または直接実行:**
```bash
./dev.sh  # 同じ効果（Node.js v20自動設定）
```

**起動成功の確認:**
```
✔ http://localhost:7071 validated successfully
Azure Static Web Apps emulator started at http://localhost:4280
Mapped function route 'api/articles' [GET] to 'articles'
```

### 2. アクセス先

- **フロントエンド**: http://localhost:4280
- **API**: http://localhost:4280/api/articles
- **直接API**: http://localhost:7071/api/articles

## 🛠️ Managed Functions のローカル確認

### Azure Functions 単体実行
```bash
# api ディレクトリで直接起動
cd api
func start

# http://localhost:7071 で Azure Functions が起動
# デバッグ情報が詳細に表示される
```

### VSCode でのデバッグ実行
```bash
# F5 キーを押してデバッガー起動
# ブレークポイントを設定してステップ実行可能
# コール問題や変数の詳細確認が可能
```

## 📰 RSS Update Script ローカル実行

### 事前準備
```bash
# Groq API Key 設定 (無料アカウント作成可能)
# https://console.groq.com/
echo "GROQ_API_KEY=gsk_your_actual_key_here" >> .env

# 環境変数確認
cd scripts
npm run check-env
```

### 実行方法
```bash
cd scripts

# TypeScript 直接実行
npm run update-news

# または dev コマンド
npm run dev

# ビルドしてから実行
npm run build && npm start
```

### 実行ログ例
```
[INFO] 2024-01-xx xx:xx:xx RSS feed parsing started
[INFO] 2024-01-xx xx:xx:xx Fetching feed from: https://azure.microsoft.com/en-us/blog/feed/
[INFO] 2024-01-xx xx:xx:xx Processing article: Azure Functions Update
[INFO] 2024-01-xx xx:xx:xx AI summary generated for article
[INFO] 2024-01-xx xx:xx:xx Article saved to Cosmos DB
```

### 実行結果確認
```bash
# フロントエンドで確認
npm run dev  # 別ターミナル
open http://localhost:4280

# API 直接確認
curl http://localhost:4280/api/articles

# 新しい記事が追加されていることを確認
```

### 完全なテスト手順
```bash
# ターミナル1: RSS 処理実行
cd scripts && npm run update-news

# ターミナル2: SWA 起動
cd .. && npm run dev

# ブラウザで http://localhost:4280 を開いて新記事確認
```

## 🔧 トラブルシューティング

### Node.js バージョンエラー

**エラー:**
```
Found Azure Functions Core Tools v4 which is incompatible with your current Node.js v23.x.x
```

**解決方法:**
```bash
# 方法1: 自動化スクリプト使用（推奨）
npm run dev

# 方法2: 直接実行
./dev.sh

# 方法3: 手動でパス設定
export PATH="/usr/local/opt/node@20/bin:$PATH"
npm run dev
```

**Note:** 
- 自動化スクリプト（`dev.sh`）が作成されているため、通常は `npm run dev` だけで動作します
- `.nvmrc` ファイルでプロジェクトのNode.jsバージョンが管理されています

### API接続エラー

**確認手順:**
```bash
# 新しいターミナルで
curl -s http://localhost:4280/api/articles | jq

# レスポンスが返ってこない場合
# 1. サーバーログでエラー確認
# 2. .env ファイルのCosmos DB設定確認
# 3. サーバー再起動
```

### パッケージエラー

```bash
# package.json構文エラーの場合
cat package.json | jq .

# 依存関係の再インストール
npm install

# API再ビルド
cd api && npm run build
```

## 🔄 開発ワークフロー

### TypeScript修正時

```bash
# API修正後
cd api
npm run build

# フロントエンドは自動リロード
```

### 環境変数変更時

```bash
# サーバー再起動が必要（Ctrl+C -> 再実行）
npm run dev
```

### デバッグ時

```bash
# サーバーログでCosmos DB接続状況確認
# "DEBUG - Actual environment variable values" でログ確認

# 新しいターミナルでAPI直接テスト
curl -v http://localhost:4280/api/articles
```

## 📝 よく使うコマンド

```bash
# Node.js バージョン切り替え
export PATH="/usr/local/opt/node@20/bin:$PATH"

# 開発サーバー起動
npm run dev

# API動作確認
curl -s http://localhost:4280/api/articles | jq

# ニュース更新スクリプト
npm run update-news

# 全プロジェクトビルド
npm run build

# ブラウザでアプリ確認
open http://localhost:4280
```

## 🚨 永続設定（推奨）

毎回のNode.js切り替えを避けるため：

```bash
# ~/.zshrc に追加（macOS Catalinaから）
echo 'export PATH="/usr/local/opt/node@20/bin:$PATH"' >> ~/.zshrc

# 設定反映
source ~/.zshrc

# 確認
node --version  # v20.x.x が表示されればOK
```