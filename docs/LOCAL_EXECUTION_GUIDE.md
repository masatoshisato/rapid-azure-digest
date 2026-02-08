# ローカル実行ガイド

Azure Static Web Apps + Azure Functions の rapid-azure-digest プロジェクトをローカル環境で実行するための手順書です。

## 📋 前提条件

### 必要なツール
- **Node.js**: v20.0.0以上
- **Azure Static Web Apps CLI**: v2.0.7以上
- **Azure Functions Core Tools**: v4.6.0以上
- **npm**: パッケージマネージャー（yarnは使用しない）

### ツールのインストール確認
```bash
node --version     # v20.20.0
swa --version      # 2.0.7
func --version     # 4.6.0
npm --version      # 確認
```

## 🚀 実行方法

### 方法１：SWA CLI統合実行（推奨）

最も簡単で本番環境に近い動作確認ができる方法です。

```bash
# 1. プロジェクトルートに移動
cd /path/to/rapid-azure-digest

# 2. API依存関係をインストール（初回のみ）、ビルド
cd api
npm install
npm run build

# 3. SWA統合実行
cd ..
swa start frontend --api-location api
```

**アクセス先**
- 🌐 **フロントエンド**: http://localhost:4280
- 🔌 **API エンドポイント**: http://localhost:4280/api/articles

### 方法２：個別実行

Azure Functions とフロントエンドを個別に起動する方法です。

#### ターミナル1（Azure Functions API）
```bash
cd /path/to/rapid-azure-digest/api
npm run build
func start
```

#### ターミナル2（フロントエンド）
```bash
cd /path/to/rapid-azure-digest

# 例：Pythonでの静的ファイルサーバー
python3 -m http.server 3000 --directory frontend

# または他の静的サーバー
# npx http-server frontend -p 3000
```

**アクセス先**
- 🌐 **フロントエンド**: http://localhost:3000
- 🔌 **API エンドポイント**: http://localhost:7071/api/articles

## 📁 重要なファイル

### 設定ファイル
- `api/local.settings.json` - ローカル開発用設定（Git管理外） 実行前に作成すること。
- `api/local.settings.json.example` - 設定テンプレート
- `api/host.json` - Azure Functions ホスト設定
- `api/package.json` - API依存関係

### ビルド出力
- `api/dist/` - TypeScriptコンパイル後のJavaScriptファイル
- `api/src/` - TypeScriptソースコード

## 🛠️ ワンライナー実行

```bash
cd /path/to/rapid-azure-digest && cd api && npm run build && cd .. && swa start frontend --api-location api
```

## 🔧 トラブルシューティング

### ポート衝突エラー
```bash
# ポート7071の使用確認と解放
lsof -i :7071
kill $(lsof -t -i :7071)

# ポート4280の使用確認と解放
lsof -i :4280
kill $(lsof -t -i :4280)
```

### ビルドエラー
```bash
# 依存関係を再インストール
cd api
rm -rf node_modules package-lock.json
npm install
npm run build
```

### SWA CLIエラー
```bash
# SWA設定確認
swa --version

# SWA再インストール（グローバル）
npm uninstall -g @azure/static-web-apps-cli
npm install -g @azure/static-web-apps-cli
```

## 📂 プロジェクト構造

```
rapid-azure-digest/
├── api/                    # Azure Functions
│   ├── src/
│   │   ├── functions/
│   │   │   └── articles.ts
│   │   └── utils/
│   │       └── logger.ts
│   ├── dist/              # ビルド出力
│   ├── host.json
│   ├── local.settings.json
│   └── package.json
├── frontend/              # 静的サイト
│   └── index.html
└── docs/                 # ドキュメント
    └── LOCAL_EXECUTION_GUIDE.md
```

## 🎯 開発フロー

1. **初回セットアップ**:
   ```bash
   cd api && npm install && cd ..
   ```

2. **コード変更時**:
   ```bash
   cd api && npm run build && cd ..
   ```

3. **ローカル実行**:
   ```bash
   swa start frontend --api-location api
   ```

4. **動作確認**:
   - http://localhost:4280 でフロントエンド確認
   - http://localhost:4280/api/articles でAPI確認

## 📚 関連ドキュメント

- [Azure Static Web Apps CLI](https://github.com/Azure/static-web-apps-cli)
- [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local)
- [プロジェクト README](../README.md)

---

**最終更新**: 2026年2月8日