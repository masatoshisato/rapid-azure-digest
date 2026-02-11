import { app, InvocationContext, Timer } from '@azure/functions';
import { AzureNewsProcessor } from '../lib/news-processor';
import { Logger } from '../lib/types';

/**
 * Azure Functions Timer Trigger for updating RSS articles
 * Runs every hour to fetch and process new Azure RSS articles
 */
export async function updateArticlesTimer(myTimer: Timer, context: InvocationContext): Promise<void> {
    Logger.info(`⏰ Timer trigger function started at: ${new Date().toISOString()}`);
    
    try {
        // 環境変数チェック
        if (!process.env.GROQ_API_KEY) {
            Logger.error('❌ Error: GROQ_API_KEY environment variable is required');
            throw new Error('Missing GROQ_API_KEY environment variable');
        }
        
        if (!process.env.COSMOS_DB_ENDPOINT || !process.env.COSMOS_DB_KEY) {
            Logger.error('❌ Error: Cosmos DB environment variables are required');
            throw new Error('Missing Cosmos DB environment variables');
        }
        
        Logger.info('🔍 環境変数チェック完了');
        
        // Timer 情報をログに記録
        if (myTimer.isPastDue) {
            Logger.info('⚠️ Timer is running late!');
        }
        
        // ニュース処理を実行
        const processor = new AzureNewsProcessor();
        const processingResult = await processor.processUpdates(100); // 最大100件処理
        
        Logger.info('✅ Timer trigger function completed successfully');
        Logger.info(`処理結果: 新規${processingResult.articleStats.newArticles}件, スキップ${processingResult.articleStats.skippedExisting}件, 削除${processingResult.articleStats.deletedOldArticles}件`);
        
    } catch (error) {
        Logger.error('❌ Timer trigger function failed:', error);
        
        // Azure Functions の監視用にエラーを再スロー
        throw error;
    }
}

// Timer Trigger の設定
app.timer('updateArticlesTimer', {
    // CRON expression: 毎時0分に実行 (UTC)
    // 0 0 * * * * = 毎時0分0秒
    schedule: '0 0 * * * *',
    handler: updateArticlesTimer,
    
    // Timer の追加設定
    runOnStartup: false, // スタートアップ時には実行しない
    useMonitor: true     // Timer 監視を有効にする
});