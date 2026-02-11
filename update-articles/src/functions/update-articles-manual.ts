import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureNewsProcessor } from '../lib/news-processor';
import { Logger } from '../lib/types';

/**
 * Azure Functions HTTP Trigger for manual RSS article updates
 * Allows administrators to manually trigger news updates
 */
export async function updateArticlesHttp(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    Logger.info(`🔗 HTTP trigger function started at: ${new Date().toISOString()}`);
    
    try {
        // クエリパラメータから制限数を取得（デフォルト100）
        const limitParam = request.query.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 100;
        
        if (isNaN(limit) || limit < 0) {
            return {
                status: 400,
                jsonBody: {
                    error: 'Invalid limit parameter. Must be a positive number.',
                    example: '/api/update-articles-manual?limit=50'
                }
            };
        }
        
        // 環境変数チェック
        if (!process.env.GROQ_API_KEY) {
            Logger.error('❌ Error: GROQ_API_KEY environment variable is required');
            return {
                status: 500,
                jsonBody: {
                    error: 'Server configuration error: Missing GROQ_API_KEY'
                }
            };
        }
        
        if (!process.env.COSMOS_DB_ENDPOINT || !process.env.COSMOS_DB_KEY) {
            Logger.error('❌ Error: Cosmos DB environment variables are required');
            return {
                status: 500,
                jsonBody: {
                    error: 'Server configuration error: Missing Cosmos DB configuration'
                }
            };
        }
        
        Logger.info(`🔍 環境変数チェック完了、処理制限: ${limit}件`);
        
        // ニュース処理を実行
        const processor = new AzureNewsProcessor();
        const processingResult = await processor.processUpdates(limit);
        
        Logger.info('✅ HTTP trigger function completed successfully');
        
        return {
            status: 200,
            jsonBody: {
                success: true,
                message: 'ニュース更新が正常に完了しました',
                functionName: 'updateArticlesManual',
                summary: processingResult,
                performance: {
                    totalTimeSeconds: processingResult.processingTimeSec,
                    totalTimeMinutes: Math.floor(processingResult.processingTimeSec / 60),
                    averageTimePerArticleMs: processingResult.articleStats.newArticles > 0 ? 
                        Math.round(processingResult.processingTimeMs / processingResult.articleStats.newArticles) : 0,
                    articlesPerSecond: processingResult.processingTimeSec > 0 ? 
                        (processingResult.articleStats.newArticles / processingResult.processingTimeSec).toFixed(2) : '0'
                },
                systemInfo: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    timestamp: processingResult.endTime
                }
            }
        };
        
    } catch (error) {
        Logger.error('❌ HTTP trigger function failed:', error);
        
        // 詳細なエラー情報を構築
        const errorInfo: any = {
            error: 'ニュース更新処理中にエラーが発生しました',
            timestamp: new Date().toISOString(),
            functionName: 'updateArticlesManual',
            nodeVersion: process.version,
            platform: process.platform
        };

        if (error instanceof Error) {
            errorInfo.errorType = error.constructor.name;
            errorInfo.message = error.message;
            errorInfo.stack = error.stack;
            
            // 追加のError プロパティがあれば含める
            if ('code' in error) {
                errorInfo.errorCode = (error as any).code;
            }
            if ('errno' in error) {
                errorInfo.errno = (error as any).errno;
            }
            if ('syscall' in error) {
                errorInfo.syscall = (error as any).syscall;
            }
            if ('path' in error) {
                errorInfo.path = (error as any).path;
            }
        } else {
            errorInfo.message = String(error);
            errorInfo.errorType = typeof error;
            errorInfo.rawError = error;
        }

        // 環境変数の存在確認（値は含めない、セキュリティのため）
        errorInfo.environmentCheck = {
            hasGroqApiKey: !!process.env.GROQ_API_KEY,
            hasCosmosDbEndpoint: !!process.env.COSMOS_DB_ENDPOINT,
            hasCosmosDbKey: !!process.env.COSMOS_DB_KEY,
            hasCosmosDbDatabaseName: !!process.env.COSMOS_DB_DATABASE_NAME,
            hasCosmosDbContainerName: !!process.env.COSMOS_DB_CONTAINER_NAME,
            hasArticleRetentionDays: !!process.env.ARTICLE_RETENTION_DAYS
        };

        return {
            status: 500,
            jsonBody: errorInfo
        };
    }
}

// HTTP Trigger の設定
app.http('updateArticlesManual', {
    methods: ['GET', 'POST'],
    authLevel: 'function', // Function キーによる認証が必要
    handler: updateArticlesHttp
});