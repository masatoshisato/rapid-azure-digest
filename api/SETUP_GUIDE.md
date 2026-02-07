# Azure Functions APIモジュール セットアップガイド

## 🚀 完全セットアップ手順

### 1. 環境準備

#### Node.js v20 インストール・設定
```bash
# Node.js v20 インストール
brew install node@20

# ~/.zshrcに永続的に追加
echo 'export PATH="/usr/local/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# バージョン確認
node --version  # v20.x.x を確認
```

#### Azure Functions Core Tools インストール
```bash
# Homebrewタップ追加
brew tap azure/functions

# Azure Functions Core Tools v4 インストール
brew install azure-functions-core-tools@4

# ~/.zshrcにパス追加
echo 'export PATH="/usr/local/opt/azure-functions-core-tools@4/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# バージョン確認
func --version  # 4.x.x を確認
```

### 2. プロジェクト初期化

#### ワークスペース設定修正
```bash
# ルートpackage.jsonのpostinstallスクリプトを無効化
cd /path/to/rapid-azure-digest
sed -i '' 's/"postinstall":/"postinstall-disabled":/' package.json
```

#### 依存関係インストール
```bash
# apiディレクトリで直接npm install
cd api
rm -rf node_modules package-lock.json
npm install
```

### 3. TypeScript設定とビルド問題解決

#### 重要: tsconfig.json 設定変更
```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "CommonJS",
    "lib": ["ES2018"],
    "outDir": ".",              // ←🔥 ここがポイント！distではなく"."に設定
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"]
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

#### ビルド実行
```bash
# 既存出力をクリア
rm -f articles.js articles.d.ts articles.js.map

# TypeScriptコンパイル
npm run build

# 出力確認
ls -la articles.js  # ← ルートディレクトリに直接生成される
```

### 4. Azure Functions 起動

```bash
# apiディレクトリで実行
cd /path/to/rapid-azure-digest/api
func start
```

### 5. 動作確認

```bash
# 別ターミナルでテスト
curl http://localhost:7071/api/articles
```

## 🛠 distディレクトリ問題の解決策

### 問題
- TypeScriptが `dist/articles.js` に出力
- Azure Functionsが `articles.js` をルートで探す
- ➡️ ファイルが見つからないエラー

### 解決策1: tsconfig.jsonのoutDir変更 (推奨)
```json
"outDir": "."  // distではなくルートディレクトリに直接出力
```

### 解決策2: package.jsonのmain変更
```json
"main": "dist/articles.js"  // dist配下を指定
```

### 解決策3: 手動コピー
```bash
cp dist/articles.js .  // 毎回手動コピー（非推奨）
```

## 🔧 トラブルシューティング

### ポート使用中エラー
```bash
# プロセス確認
lsof -i :7071

# 強制終了
kill -9 <PID>
```

### Node.jsバージョンエラー
```bash
# バージョン確認
node --version

# パス設定確認
echo $PATH | grep node@20
```

### npm workspaces 無限ループ
```bash
# postinstallスクリプト確認
grep postinstall package.json

# 無効化
sed -i '' 's/"postinstall":/"postinstall-disabled":/' package.json
```

## ✅ 成功時の出力例

### func start 成功時
```
Found the following functions:
Host.Functions.articles

Mapped function route 'api/articles' [GET] to 'articles'
Host started
```

### API レスポンス
```json
{"error":"Failed to fetch articles","message":"Cannot connect to your-cosmos-endpoint..."}
```
↑ Cosmos DB接続エラーは想定内（設定がプレースホルダーのため）