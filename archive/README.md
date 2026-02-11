# Archive (プロジェクト ドキュメント)

プロジェクトの設計文書、仕様書、分析レポートなどのアーカイブファイルを管理しています。

## 📁 ファイル構成

```
archive/
├── docs/
│   ├── optimization-report-20260201.md      # パフォーマンス最適化レポート
│   ├── swa-config-samples.md                # Static Web Apps 設定例
│   ├── swa-deployment-guide.md              # SWA デプロイメントガイド
│   ├── swa-quick-reference.md               # SWA クイックリファレンス
│   ├── webui-specification-20260201.md      # WebUI 設計仕様書
│   └── workflow-specification-20260201.md   # ワークフロー設計仕様書
└── README.md                                # このファイル
```

## 📄 ドキュメント概要

### 設計・仕様書

#### webui-specification-20260201.md
- **目的**: フロントエンド UI/UX の詳細設計仕様
- **内容**: レスポンシブデザイン、コンポーネント設計、API連携仕様
- **対象**: フロントエンド開発、UI/UX設計

#### workflow-specification-20260201.md
- **目的**: Azure Functions ワークフロー設計仕様
- **内容**: HTTP/Timerトリガー、エラーハンドリング、データフロー設計
- **対象**: バックエンド開発、システム設計

### デプロイメント・運用ガイド

#### swa-deployment-guide.md
- **目的**: Azure Static Web Apps の包括的なデプロイメントガイド
- **内容**: 段階的デプロイ手順、環境設定、トラブルシューティング
- **対象**: DevOps エンジニア、デプロイメント担当者

#### swa-config-samples.md
- **目的**: Static Web Apps 設定ファイルのサンプル集
- **内容**: staticwebapp.config.json の各種設定パターン、ルーティング設定
- **対象**: 設定管理、デプロイメント設定

#### swa-quick-reference.md
- **目的**: SWA 運用時のクイックリファレンス
- **内容**: よく使うコマンド、設定確認方法、トラブル対応
- **対象**: 運用担当者、緊急対応

### 分析・改善レポート

#### optimization-report-20260201.md
- **目的**: システムパフォーマンス分析と最適化提案
- **内容**: 応答時間分析、リソース使用量、コスト最適化案
- **対象**: システム運用、パフォーマンス改善

## 🎯 ドキュメント使用ガイド

### 開発フェーズ別の参照ドキュメント

#### 🚀 新規開発時
1. **workflow-specification-20260201.md** - システム設計理解
2. **webui-specification-20260201.md** - UI設計理解
3. **swa-config-samples.md** - 設定参考

#### 🔧 運用・メンテナンス時
1. **swa-quick-reference.md** - 日常運用コマンド
2. **optimization-report-20260201.md** - パフォーマンス改善
3. **swa-deployment-guide.md** - デプロイ手順確認

#### ⚠️ トラブル対応時
1. **swa-quick-reference.md** - 緊急対応手順
2. **swa-deployment-guide.md** - デプロイメント問題
3. **optimization-report-20260201.md** - パフォーマンス問題

## 📚 ドキュメント管理方針

### 作成・更新基準
- **作成日**: ファイル名に YYYYMMDD 形式で日付を含める
- **更新頻度**: 重要な機能追加・変更時に更新
- **アーカイブ**: 古い仕様書は `docs/archive/YYYY/` に移動

### 文書形式
- **フォーマット**: Markdown (.md)
- **文字エンコーディング**: UTF-8
- **図表**: Mermaid.js を使用
- **コードサンプル**: シンタックスハイライト付き

### レビュープロセス
1. 初回作成時: 設計レビュー実施
2. 更新時: 影響範囲確認
3. 定期点検: 半年に1回、内容の妥当性確認

## 🔍 ドキュメント検索・参照方法

### ファイル内検索 (VS Code)
```bash
# 全文検索
Ctrl/Cmd + Shift + F

# ファイル名検索
Ctrl/Cmd + P
```

### グローバル検索 (CLI)
```bash
# archive/ 内の全文検索
grep -r "検索キーワード" archive/docs/

# 特定拡張子のファイル検索
find archive/ -name "*.md" -exec grep -l "Azure" {} +
```

### 主要キーワード一覧
- **Azure Static Web Apps**: SWA設定、デプロイメント
- **Azure Functions**: HTTP/Timer トリガー、バックエンド処理
- **Cosmos DB**: データベース設計、接続設定
- **GitHub Actions**: CI/CD、自動デプロイ
- **パフォーマンス**: 最適化、監視、チューニング

## 🔄 今後の拡張予定

### 追加予定ドキュメント
- [ ] **security-guidelines.md** - セキュリティガイドライン
- [ ] **monitoring-setup.md** - 監視・アラート設定
- [ ] **cost-optimization.md** - コスト最適化戦略
- [ ] **disaster-recovery.md** - 災害復旧計画
- [ ] **api-documentation.md** - API仕様書

### ドキュメント改善計画
- [ ] Mermaid 図表の追加
- [ ] インタラクティブな設定ガイド
- [ ] 動画チュートリアル (複雑な手順)
- [ ] 多言語対応 (英語版)

## 📄 ライセンス・製作者情報

- **ライセンス**: MIT License (プロジェクトルート参照)
- **製作者**: GitHub Copilot + Azure専門チーム
- **最終更新**: 2026年2月11日
- **管理方針**: プロジェクト終了後5年間保持

---

**注意**: このドキュメントは参照用です。最新の実装については、実際のソースコードと `infrastructure/`, `api/`, `update-articles/`, `frontend/` の README.md を参照してください。