# Azure RSS自動処理ワークフローシステム設計書

**作成日:** 2026年2月1日  
**最終更新:** 2026年2月2日  
**プロジェクト:** rapid-azure-digest  
**対象ファイル:** .github/workflows/daily-azure-news.yml  

> **⚠️ 更新情報 (2026-02-02):**
> - GitHub Actions を v3 に変更 (VSCodeエラー対応)
> - Node.js を v20 LTS に変更
> - Azure Static Web Apps 自動デプロイ機能を追加
> - 本番サイト: https://salmon-beach-0b86ff00f.4.azurestaticapps.net

## 📋 ワークフロー概要

Microsoft Azure RSS フィードを自動取得し、AI翻訳・要約処理を行い、結果をGitHubリポジトリに自動コミットし、Azure Static Web Appsに自動デプロイする完全自動化システム。日本語でのAzureニュース配信を目的とした、24時間365日稼働するワークフローです。

---

## ⚙️ システム構成

### 実行環境
- **プラットフォーム:** ubuntu-latest (GitHub Actions)
- **Node.js:** v20 (LTS) *※v23から変更*
- **パッケージマネージャー:** npm with cache
- **実行間隔:** 毎日午前0時 JST (15:00 UTC)
- **デプロイ:** Azure Static Web Apps 自動デプロイ *※新機能*

### トリガー設定
```yaml
on:
  schedule:
    - cron: '0 15 * * *'  # 毎日15:00 UTC = 0:00 JST
  workflow_dispatch:      # 手動実行対応
```

**設計思想:**
- **日次実行** - Azure更新情報の適切な頻度
- **JST対応** - 日本のユーザー向けタイムゾーン
- **手動実行** - デバッグ・メンテナンス用

---

## 🔧 ワークフロー詳細

### Step 1: 環境準備
```yaml
- name: Checkout repository
  uses: actions/checkout@v4
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
```
**目的:** リポジトリコード取得とGit操作権限確保

### Step 2: Node.js環境構築
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '23'
    cache: 'npm'
```
**効果:** 
- 本番レベルのNode.js v23使用
- npmキャッシュによる高速化

### Step 3: 依存関係インストール
```yaml
- name: Install dependencies
  run: npm install
```
**対象パッケージ:**
- feedparser: RSS解析
- groq-sdk: AI翻訳・要約
- tsx: TypeScript実行
- その他ユーティリティ

### Step 4: メインスクリプト実行
```yaml
- name: Update Azure news
  env:
    GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
  run: npx tsx scripts/update-news.ts
```
**処理内容:**
- Azure RSS フィード取得
- 365日フィルタリング
- AI翻訳・要約処理  
- data/news.json 更新

### Step 5: 自動コミット・プッシュ
```yaml
- name: Commit and push changes
  run: |
    git config --local user.email "action@github.com"
    git config --local user.name "github-actions[bot]"
    
    if git diff --quiet data/news.json; then
      echo "No changes in news.json, skipping commit"
    else
      echo "Changes detected in news.json, committing..."
      git add data/news.json
      git commit -m "feat: update Azure news data [skip ci]"
      git push
    fi
```

---

## 🛡️ セキュリティ・信頼性設計

### 認証・権限管理
- **GROQ_API_KEY:** GitHub Secrets で暗号化管理
- **GITHUB_TOKEN:** 自動生成、最小権限の原則
- **contents: write:** JSONファイル更新のみの限定権限

### エラーハンドリング
- **変更検知機能:** 不要なコミット防止
- **無限ループ防止:** `[skip ci]` でワークフロー再実行回避
- **ロールバック対応:** Gitコミット履歴で変更追跡可能

### データ整合性
```yaml
git diff --quiet data/news.json
```
- 変更がある場合のみコミット実行
- 冪等性確保（同じ処理を複数回実行しても安全）

---

## 📊 運用特性

### 処理時間予測
| 処理段階 | 推定時間 | 備考 |
|---------|---------|------|
| 環境構築 | 30-60秒 | Node.js+依存関係 |
| スクリプト実行 | 30-180秒 | 記事数・AI処理時間に依存 |
| Git操作 | 5-15秒 | ファイルサイズに依存 |
| **合計** | **1-4分** | **通常2分程度** |

### リソース使用量
- **CPU:** 軽量（RSS解析・AI API呼び出し）
- **メモリ:** 最大100MB程度
- **ストレージ:** data/news.json（数MB）
- **ネットワーク:** RSS取得・AI API・Git操作

### 成功率要因
- **RSS可用性:** 99.9%+ (Microsoft公式)
- **AI API安定性:** Groq高可用性
- **GitHub Actions:** 99.9%+ SLA

---

## 🎯 出力仕様

### 自動コミット形式
```
feat: update Azure news data [skip ci]

- Updated Azure RSS feed data
- Automated daily update via GitHub Actions  
- 2026-02-02 15:00:00 UTC
```

### データファイル更新
**場所:** `data/news.json`  
**形式:** 構造化JSON  
**内容:**
- lastUpdated: ISO8601形式タイムスタンプ
- articles: 翻訳済み記事配列
- 自動365日ローテーション

---

## 📈 監視・運用

### 実行確認方法
1. **GitHub Actions タブ**
   - 実行状況・ログ確認
   - 成功/失敗通知
   - 実行履歴追跡

2. **自動コミット確認**
   - commit履歴の日次更新確認
   - github-actions[bot] のコミット確認

3. **データ確認**
   - data/news.json の lastUpdated確認
   - 新記事の追加確認

### トラブルシューティング
| 症状 | 原因候補 | 対処法 |
|------|---------|-------|
| 実行失敗 | API_KEY無効 | GitHub Secrets確認 |
| コミットなし | 新記事なし | 正常動作（記事取得確認） |
| タイムアウト | AI処理遅延 | ログ確認・記事数制限検討 |

---

## 🚀 最適化ポイント

### 実装済み最適化
- **npm cache:** 依存関係高速化
- **条件付きコミット:** 不要操作削除
- **365日フィルタ:** 古記事の処理回避
- **フルコンテンツ取得削除:** 83%処理時間短縮

### 今後の改善計画

#### Phase 1: エラーハンドリング強化
- [ ] AI API失敗時のリトライ機能
- [ ] 部分的失敗時の継続処理
- [ ] Slack/Email通知機能

#### Phase 2: パフォーマンス向上
- [ ] 並列処理による高速化
- [ ] 差分検出による効率化
- [ ] キャッシュ機能の実装

#### Phase 3: 機能拡張
- [ ] 複数RSS源対応
- [ ] カテゴリ別分類
- [ ] 統計情報生成

---

## 🔍 設計判断の背景

### タイムゾーン設定 (JST)
**判断:** 15:00 UTC = 0:00 JST  
**理由:** 日本のビジネス時間前に最新情報提供

### 毎日実行頻度
**判断:** 日次実行（時間単位ではない）  
**理由:** Azure更新頻度とリソース効率のバランス

### [skip ci] の採用
**判断:** 自動コミットでワークフロー再実行を防止  
**理由:** 無限ループリスク回避とリソース節約

### contents: write 権限
**判断:** 最小必要権限の付与  
**理由:** セキュリティベストプラクティス準拠

---

## 📚 関連リソース

### 依存ファイル
- **scripts/update-news.ts** - メインロジック
- **package.json** - 依存関係定義
- **data/news.json** - 出力データファイル
- **.env.example** - 環境変数テンプレート

### 外部サービス
- **Microsoft Azure RSS** - データ源
- **Groq AI API** - 翻訳・要約エンジン
- **GitHub Actions** - 実行基盤
- **GitHub Secrets** - 認証情報管理

### ドキュメント
- **README.md** - プロジェクト概要
- **docs/optimization-report-20260201.md** - 性能最適化レポート
- **debug-workflow.sh** - ローカルテスト環境

---

## 📋 チェックリスト

### デプロイ前確認
- [x] GROQ_API_KEY がGitHub Secretsに設定済み
- [x] scripts/update-news.ts の動作確認済み
- [x] data/ ディレクトリの存在確認
- [x] .gitignore の適切な設定

### 運用開始後確認
- [ ] 初回実行の成功確認
- [ ] data/news.json の自動更新確認
- [ ] GitHub Actions ログの健全性確認
- [ ] コミット履歴の適切な形式確認

---

**文書責任者:** GitHub Copilot  
**最終更新:** 2026年2月1日  
**次回レビュー予定:** 2026年3月1日  
**承認状況:** 本番運用開始準備完了  