#!/bin/bash

# ============================================================================
# Azure Static Web App デプロイメント スクリプト
# Purpose: rapid-azure-digest Web サイトの Azure Static Web Apps デプロイ
# Usage: ./deploy-staticwebapp.sh --subscription <subscription-id> --resource-group <rg-name>
# ============================================================================

set -euo pipefail

# カラー定義
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# ログ関数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# デフォルト値
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BICEP_FILE="${SCRIPT_DIR}/staticwebapp.bicep"
PARAMETERS_FILE="${SCRIPT_DIR}/staticwebapp.parameters.json"
DEPLOYMENT_NAME="staticwebapp-deployment-$(date +%Y%m%d-%H%M%S)"

# 変数
SUBSCRIPTION_ID=""
RESOURCE_GROUP=""
LOCATION="eastus2"
STATIC_WEBAPP_NAME="rapid-azure-digest"

# 使用方法
usage() {
    cat << EOF
Azure Static Web App デプロイメント スクリプト

使用方法:
    $0 --subscription <subscription-id> --resource-group <resource-group-name> [OPTIONS]

必須パラメータ:
    -s, --subscription      Azure サブスクリプション ID
    -g, --resource-group    リソースグループ名

オプション:
    -l, --location          デプロイ先リージョン (デフォルト: eastus2)
    -n, --name              Static Web App 名 (デフォルト: rapid-azure-digest)
    -h, --help              このヘルプを表示

例:
    # 基本的なデプロイ
    $0 -s "12345678-1234-1234-1234-123456789012" -g "rg-rapid-azure-digest"

    # カスタムリージョン
    $0 -s "12345678-1234-1234-1234-123456789012" -g "rg-rapid-azure-digest" \\
       -l "westeurope"

注意:
    GitHub統合は後からAzure Portalで設定できます。
EOF
}

# コマンドライン引数パース
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -s|--subscription)
                SUBSCRIPTION_ID="$2"
                shift 2
                ;;
            -g|--resource-group)
                RESOURCE_GROUP="$2"
                shift 2
                ;;
            -l|--location)
                LOCATION="$2"
                shift 2
                ;;
            -n|--name)
                STATIC_WEBAPP_NAME="$2"
                shift 2
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done

    # 必須パラメータチェック
    if [[ -z "$SUBSCRIPTION_ID" ]]; then
        log_error "サブスクリプション ID が必要です (-s|--subscription)"
        usage
        exit 1
    fi

    if [[ -z "$RESOURCE_GROUP" ]]; then
        log_error "リソースグループ名が必要です (-g|--resource-group)"
        usage
        exit 1
    fi
}

# 前提条件チェック
check_prerequisites() {
    log_info "前提条件をチェック中..."

    # Azure CLI インストール確認
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI がインストールされていません"
        log_info "インストール方法: https://docs.microsoft.com/cli/azure/install-azure-cli"
        exit 1
    fi

    # Azure CLI ログイン確認
    if ! az account show &> /dev/null; then
        log_error "Azure CLI にログインしていません"
        log_info "実行してください: az login"
        exit 1
    fi

    # Bicep ファイル存在確認
    if [[ ! -f "$BICEP_FILE" ]]; then
        log_error "Bicep ファイルが見つかりません: $BICEP_FILE"
        exit 1
    fi

    # パラメータファイル存在確認
    if [[ ! -f "$PARAMETERS_FILE" ]]; then
        log_error "パラメータファイルが見つかりません: $PARAMETERS_FILE"
        exit 1
    fi

    log_success "前提条件チェック完了"
}

# Azure 接続設定
setup_azure() {
    log_info "Azure サブスクリプション設定中..."

    # サブスクリプション設定
    if ! az account set --subscription "$SUBSCRIPTION_ID" 2>/dev/null; then
        log_error "無効なサブスクリプション ID: $SUBSCRIPTION_ID"
        exit 1
    fi

    # 現在の設定確認
    local current_account
    current_account=$(az account show --query '[name, id]' --output tsv)
    log_info "選択されたサブスクリプション: $current_account"

    # リソースグループ存在確認・作成
    if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
        log_warning "リソースグループ '$RESOURCE_GROUP' が存在しません"
        read -p "作成しますか? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "リソースグループ作成中..."
            az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
            log_success "リソースグループ '$RESOURCE_GROUP' を作成しました"
        else
            log_error "デプロイをキャンセルしました"
            exit 1
        fi
    else
        log_success "リソースグループ '$RESOURCE_GROUP' が確認できました"
    fi
}

# パラメータファイル更新
update_parameters() {
    log_info "パラメータファイル更新中..."

    local temp_params="/tmp/staticwebapp-params-$$.json"
    
    # JSONパラメータファイルを動的に更新
    jq --arg name "$STATIC_WEBAPP_NAME" \
       --arg location "$LOCATION" \
       '.parameters.staticWebAppName.value = $name |
        .parameters.location.value = $location' \
       "$PARAMETERS_FILE" > "$temp_params"

    # 一時ファイルを元のファイルに移動
    mv "$temp_params" "$PARAMETERS_FILE"
    
    log_success "パラメータファイルを更新しました"
}

# デプロイメント実行
deploy_infrastructure() {
    log_info "Static Web App デプロイメント開始..."
    
    # Bicep テンプレートのバリデーション
    log_info "Bicep テンプレートの検証中..."
    if ! az deployment group validate \
        --resource-group "$RESOURCE_GROUP" \
        --template-file "$BICEP_FILE" \
        --parameters "@$PARAMETERS_FILE" \
        --output none; then
        log_error "Bicep テンプレートのバリデーションに失敗しました"
        exit 1
    fi
    log_success "テンプレートバリデーション完了"

    # デプロイメント実行
    log_info "インフラストラクチャをデプロイ中... (この処理は数分かかる場合があります)"
    local deployment_result
    deployment_result=$(az deployment group create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --template-file "$BICEP_FILE" \
        --parameters "@$PARAMETERS_FILE" \
        --query 'properties.outputs' \
        --output json)

    if [[ $? -eq 0 ]]; then
        log_success "デプロイメント完了!"
        
        # デプロイ結果表示
        log_info "デプロイメント結果:"
        echo "$deployment_result" | jq -r '
            "  • Static Web App ID: " + .staticWebAppId.value,
            "  • ホスト名: " + .defaultHostname.value,
            "  • サイト URL: " + .siteUrl.value,
            "  • リソースグループ: " + .resourceGroupName.value,
            "  • リージョン: " + .location.value'
        
        # サイト URL をクリップボードにコピー（macOS）
        if command -v pbcopy &> /dev/null; then
            local site_url
            site_url=$(echo "$deployment_result" | jq -r '.siteUrl.value')
            echo "$site_url" | pbcopy
            log_info "サイト URL をクリップボードにコピーしました"
        fi
        
    else
        log_error "デプロイメントが失敗しました"
        exit 1
    fi
}

# ファイルアップロード手順案内
show_upload_instructions() {
    log_info "次の手順: ファイルアップロード"
    echo
    
    echo -e "${GREEN}✅ Static Web App のデプロイが完了しました！${NC}"
    echo
    echo -e "${YELLOW}📁 ファイルアップロード手順:${NC}"
    echo
    echo "1. Azure Static Web Apps CLI をインストール:"
    echo -e "   ${BLUE}npm install -g @azure/static-web-apps-cli${NC}"
    echo
    echo "2. ワークスペースディレクトリで以下を実行:"
    echo -e "   ${BLUE}cd /Users/sato/proj/rapid-azure-digest${NC}"
    echo -e "   ${BLUE}swa deploy --resource-group \"$RESOURCE_GROUP\" --app-name \"$STATIC_WEBAPP_NAME\" --app-location \".\"${NC}"
    echo
    echo "3. または、Azure Portal からファイルをアップロード:"
    echo "   • Azure Portal → Static Web Apps → \"$STATIC_WEBAPP_NAME\""
    echo "   • \"Functions and API\" → \"Browse files\""
    echo
    echo -e "${YELLOW}📋 アップロード対象ファイル:${NC}"
    echo "   • index.html (メインページ)"
    echo "   • data/news.json (ニュースデータ)"
    echo
    echo -e "${YELLOW}🔄 後からのGitHub連携:${NC}"
    echo "   Azure Portal → Static Web Apps → 設定 → ソース"
    echo "   から GitHub リポジトリとの連携を設定できます。"
    echo
}

# クリーンアップ関数
cleanup() {
    log_info "クリーンアップ中..."
    # 一時ファイルがあれば削除
    rm -f /tmp/staticwebapp-params-*.json
}

# エラートラップ
trap cleanup EXIT

# メイン処理
main() {
    log_info "Azure Static Web App デプロイメントスクリプト開始"
    log_info "プロジェクト: rapid-azure-digest"
    echo

    parse_args "$@"
    check_prerequisites
    setup_azure
    update_parameters
    deploy_infrastructure
    show_upload_instructions

    log_success "すべての処理が完了しました! 🎉"
}

# スクリプト実行
main "$@"