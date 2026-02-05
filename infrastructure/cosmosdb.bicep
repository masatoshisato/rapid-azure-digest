@description('Static Web App name for access control')
param staticWebAppName string = 'rapid-azure-digest'

@description('Enable secure access from Static Web App only')
param enableSecureAccess bool = true

@description('Cosmos DB account name')
param accountName string = 'azure-news-cosmosdb'

@description('Location for Cosmos DB account')
param location string = resourceGroup().location

@description('Database name')
param databaseName string = 'NewsDatabase'

@description('Container name')
param containerName string = 'Articles'

//  既存のStatic Web Appリソースへの参照
resource existingStaticWebApp 'Microsoft.Web/staticSites@2022-09-01' existing = if (enableSecureAccess) {
  name: staticWebAppName
}

resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: accountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    // 無料枠を確実に適用
    enableFreeTier: true
    
    // 単一リージョンで最小構成
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    
    // パフォーマンス設定（コスト最小化）
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session' // 無料枠に適した設定
    }
    
    // セキュリティ設定
    disableKeyBasedMetadataWriteAccess: false
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    
    // ネットワーク設定（セキュア）
    publicNetworkAccess: enableSecureAccess ? 'Disabled' : 'Enabled'
    isVirtualNetworkFilterEnabled: true
    
    // IPファイアウォール設定（Azure サービスのみ許可）
    ipRules: enableSecureAccess ? [
      {
        ipAddressOrRange: '0.0.0.0'  // Azure サービス間通信を許可
      }
    ] : []
    
    // Azure サービスからのアクセス許可
    networkAclBypass: 'AzureServices'
    networkAclBypassResourceIds: enableSecureAccess ? [
      resourceId('Microsoft.Web/staticSites', staticWebAppName)
    ] : []
    
    // 機能の無効化（コスト削減）
    enableAnalyticalStorage: false
    enableCassandraConnector: false
    
    // バックアップ設定（最小構成）
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 240  // 4時間間隔（最大値）
        backupRetentionIntervalInHours: 8  // 8時間保持（最小値）
      }
    }
  }
}

// 無料枠データベース作成（400 RU/s 固定）
resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosDbAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
    options: {
      // 無料枠の範囲内で固定スループット
      throughput: 400  // 400 RU/s（無料枠上限）
    }
  }
}

// コンテナー作成（データベースのスループット共有）
resource container 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: containerName
  properties: {
    resource: {
      id: containerName
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
      // インデックス設定（最小構成）
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
    }
    // データベースレベルのスループットを共有（追加課金なし）
    options: {}
  }
}

// Static Web App用のCosmos DBデータ投稿者ロール
resource cosmosDbDataContributorRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (enableSecureAccess) {
  name: guid(cosmosDbAccount.id, existingStaticWebApp.id, 'Cosmos DB Built-in Data Contributor')
  scope: cosmosDbAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '00000000-0000-0000-0000-000000000002') // Cosmos DB Built-in Data Contributor
    principalId: enableSecureAccess ? existingStaticWebApp.identity.principalId : ''
    principalType: 'ServicePrincipal'
  }
}

// 出力（接続情報）
output cosmosDbAccountName string = cosmosDbAccount.name
output cosmosDbEndpoint string = cosmosDbAccount.properties.documentEndpoint
output cosmosDbPrimaryKey string = cosmosDbAccount.listKeys().primaryMasterKey
output cosmosDbConnectionString string = 'AccountEndpoint=${cosmosDbAccount.properties.documentEndpoint};AccountKey=${cosmosDbAccount.listKeys().primaryMasterKey};'
output databaseName string = databaseName
output containerName string = containerName

// 無料枠確認用の出力
output freeTierEnabled bool = cosmosDbAccount.properties.enableFreeTier
output throughputRUs int = 400
output maxStorageGB int = 5
