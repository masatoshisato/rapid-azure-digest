// ============================================================================
// Azure Static Web App 構築用 Bicep テンプレート
// Purpose: Azure ニュースサイト用 Static Web App のプロビジョニング
// Tier: Free (無料枠)
// Deploy: Azure CLI
// ============================================================================

// パラメータ定義
@description('Static Web App の名前（リソース命名規則に従って設定）')
@minLength(2)
@maxLength(40)
param staticWebAppName string

@description('デプロイ先のリージョン')
@allowed([
  'centralus'
  'eastus2'
  'eastasia'
  'westeurope'
  'westus2'
])
param location string = 'eastus2'

@description('リソースタグ（環境・プロジェクト識別用）')
param tags object = {
  project: 'rapid-azure-digest'
  environment: 'production'
  purpose: 'news-display'
  tier: 'free'
  'cost-center': 'engineering'
}

@description('アプリケーション設定（設定値の追加が可能）')
param appSettings object = {}

@description('デプロイメント タイムスタンプ')
param deploymentTimestamp string = utcNow()

// Note: GitHub統合は後からAzure PortalまたはAzure CLIで設定可能です

// ============================================================================
// Azure Verified Modules を使用した Static Web App 定義
// ============================================================================

module staticWebApp 'br/public:avm/res/web/static-site:0.6.0' = {
  name: 'swa-deploy'
  params: {
    // 必須パラメータ
    name: staticWebAppName
    location: location
    
    // 無料枠設定
    sku: 'Free'
    
    // アプリケーション設定
    appSettings: appSettings
    
    // セキュリティ・管理設定
    allowConfigFileUpdates: true
    
    // リソースタグ
    tags: tags
    
    // テレメトリ（Azure Verified Modules の使用状況追跡）
    enableTelemetry: false
  }
}

// ============================================================================
// アウトプット定義
// ============================================================================

@description('Static Web App のリソース ID')
output staticWebAppId string = staticWebApp.outputs.resourceId

@description('デフォルト ホスト名（アクセス用 URL）')
output defaultHostname string = staticWebApp.outputs.defaultHostname

@description('Static Web App の名前')
output staticWebAppName string = staticWebApp.outputs.name

@description('リソースグループ名')
output resourceGroupName string = staticWebApp.outputs.resourceGroupName

@description('デプロイ先リージョン')
output location string = staticWebApp.outputs.location

@description('Static Web App の完全 URL')
output siteUrl string = 'https://${staticWebApp.outputs.defaultHostname}'

@description('デプロイメント情報（トラブルシューティング用）')
output deploymentInfo object = {
  resourceId: staticWebApp.outputs.resourceId
  sku: 'Free'
  tags: tags
  deploymentTimestamp: deploymentTimestamp
}

// ============================================================================
// 制約・制限事項（無料枠）
// ============================================================================
/*
Azure Static Web Apps 無料枠の制限:
- 帯域幅: 100 GB/月
- ストレージ: 0.5 GB
- ステージング環境: 3個まで
- カスタムドメイン: 2個まで
- 地理的分散: あり
- SSL証明書: 自動プロビジョニング
- Azure Functions: 無制限（Consumption プラン）
- 認証プロバイダー: GitHub, Twitter, Google, Facebook, Microsoft, Apple

制限を超える場合は sku を 'Standard' に変更してください。
Standard プランでは追加料金が発生します。
*/
