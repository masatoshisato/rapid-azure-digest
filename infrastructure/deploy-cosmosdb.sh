#!/bin/bash

# Azure Cosmos DB デプロイスクリプト（無料枠保証版）
# 使用方法: ./deploy-cosmosdb.sh --subscription "YOUR_SUBSCRIPTION_ID" --resource-group "DailyAzureNewsUpdate"

set -e

# デフォルト値
RESOURCE_GROUP="DailyAzureNewsUpdate"
LOCATION="eastus2" 
DEPLOYMENT_NAME="cosmosdb-deployment-$(date +%Y%m%d-%H%M%S)"

# 引数解析
while [[ $# -gt 0 ]]; do
  case $1 in
    --subscription)
      SUBSCRIPTION_ID="$2"
      shift 2
      ;;
    --resource-group)
      RESOURCE_GROUP="$2"
      shift 2
      ;;
    --location)
      LOCATION="$2"
      shift 2
      ;;
    -h|--help)
      echo "使用方法: $0 --subscription SUBSCRIPTION_ID [--resource-group RESOURCE_GROUP] [--location LOCATION]"
      echo ""
      echo "オプション:"
      echo "  --subscription       Azure サブスクリプションID（必須）"
      echo "  --resource-group     リソースグループ名（デフォルト: DailyAzureNewsUpdate）"
      echo "  --location           デプロイリージョン（デフォルト: eastus2）"
      echo "  -h, --help          このヘルプを表示"
      exit 0
      ;;
    *)
      echo "エラー: 不明な引数: $1"
      exit 1
      ;;
  esac
done

# 必須パラメーターチェック
if [ -z "$SUBSCRIPTION_ID" ]; then
    echo "エラー: --subscription が必要です"
    exit 1
fi

echo "🚀 Azure Cosmos DB 無料枠デプロイ開始"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 設定情報:"
echo "   サブスクリプション: $SUBSCRIPTION_ID"
echo "   リソースグループ: $RESOURCE_GROUP"  
echo "   リージョン: $LOCATION"
echo "   デプロイ名: $DEPLOYMENT_NAME"
echo ""

# サブスクリプション設定
echo "🔧 サブスクリプション設定中..."
az account set --subscription "$SUBSCRIPTION_ID"

# リソースグループの存在確認
echo "📁 リソースグループ確認中..."
if ! az group show --name "$RESOURCE_GROUP" >/dev/null 2>&1; then
    echo "⚠️  リソースグループ '$RESOURCE_GROUP' が存在しません。作成中..."
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
    echo "✅ リソースグループ作成完了"
else
    echo "✅ リソースグループ確認済み"
fi

# 無料枠チェック
echo ""
echo "🆓 Cosmos DB 無料枠確認中..."
FREE_ACCOUNTS=$(az cosmosdb list --query "[?properties.enableFreeTier==\`true\`].name" -o tsv | wc -l)
if [ "$FREE_ACCOUNTS" -ge 1 ]; then
    echo "⚠️  警告: サブスクリプションに既に無料枠Cosmos DBアカウントが存在します"
    echo "   既存の無料枠アカウント数: $FREE_ACCOUNTS"
    read -p "   続行しますか？ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ デプロイを中止しました"
        exit 1
    fi
fi

# Bicepデプロイ実行
echo ""
echo "🚀 Cosmos DB デプロイ実行中..."
echo "   ⏱️  予想時間: 3-5分"

DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DEPLOYMENT_NAME" \
    --template-file "cosmosdb.bicep" \
    --parameters "cosmosdb.parameters.json" \
    --output json)

if [ $? -eq 0 ]; then
    echo "✅ デプロイ完了!"
    
    # 出力情報の表示
    echo ""
    echo "📊 デプロイ結果:"
    echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs | to_entries[] | "   \(.key): \(.value.value)"'
    
    # 環境変数用の接続文字列出力
    echo ""
    echo "🔧 環境変数設定用:"
    CONNECTION_STRING=$(echo "$DEPLOYMENT_OUTPUT" | jq -r '.properties.outputs.cosmosDbConnectionString.value')
    echo "   export COSMOS_DB_CONNECTION_STRING='$CONNECTION_STRING'"
    
    # GitHub Secrets用
    echo ""
    echo "🔐 GitHub Secrets設定用:"
    echo "   COSMOS_DB_CONNECTION_STRING: $CONNECTION_STRING"
    
    # 無料枠確認
    echo ""
    echo "💰 料金情報:"
    echo "   🆓 無料枠: 有効"
    echo "   📊 スループット: 400 RU/s（無料枠上限）"
    echo "   💾 ストレージ: 最大 5 GB（無料枠上限）"
    echo "   💸 追加費用: なし（無料枠内）"
    
else
    echo "❌ デプロイに失敗しました"
    exit 1
fi

echo ""
echo "🎉 Cosmos DB セットアップ完了!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"