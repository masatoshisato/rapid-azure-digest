import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from '@azure/cosmos';
import { ProductionLogger } from '../utils/logger';

export async function articles(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const logger = new ProductionLogger(context);
    const operation = 'api_articles_get';
    
    // API要求開始のログ
    logger.logApiStart(operation, {
        userAgent: request.headers.get('user-agent')?.substring(0, 100) || 'unknown',
        origin: request.headers.get('origin') || 'unknown',
        method: request.method
    });

    try {
        // Cosmos DB接続設定の取得
        const endpoint = process.env.COSMOS_DB_ENDPOINT;
        const key = process.env.COSMOS_DB_KEY;
        const databaseName = process.env.COSMOS_DB_DATABASE_NAME;
        const containerName = process.env.COSMOS_DB_CONTAINER_NAME;

        // 設定検証
        const missingConfigs: string[] = [];
        if (!endpoint) missingConfigs.push('COSMOS_DB_ENDPOINT');
        if (!key) missingConfigs.push('COSMOS_DB_KEY');
        if (!databaseName) missingConfigs.push('COSMOS_DB_DATABASE_NAME');
        if (!containerName) missingConfigs.push('COSMOS_DB_CONTAINER_NAME');

        if (missingConfigs.length > 0) {
            logger.logConfigError(operation, missingConfigs);
            throw new Error(`Cosmos DB configuration is missing: ${missingConfigs.join(', ')}`);
        }

        // 型安全性の確保：この時点で全ての値が存在することが保証される
        const validatedConfig = {
            endpoint: endpoint!,
            key: key!,
            databaseName: databaseName!,
            containerName: containerName!
        };

        logger.logConfigValidation(operation, {
            databaseName: validatedConfig.databaseName,
            containerName: validatedConfig.containerName,
            hasEndpoint: true,
            hasKey: true
        });

        // Cosmos DBクライアント初期化
        const client = new CosmosClient({ 
            endpoint: validatedConfig.endpoint, 
            key: validatedConfig.key 
        });
        const database = client.database(validatedConfig.databaseName);
        const container = database.container(validatedConfig.containerName);

        logger.logExternalServiceSuccess(operation, 'cosmos_db', {
            databaseName: validatedConfig.databaseName,
            containerName: validatedConfig.containerName
        });

        // 記事データの取得
        const { resources: articles } = await container.items
            .query("SELECT * FROM c ORDER BY c.date DESC")
            .fetchAll();

        logger.logDataOperationSuccess(operation, articles.length, {
            queryType: 'fetch_all_articles',
            sortOrder: 'date_desc'
        });

        // レスポンス形式の構築
        const response = {
            lastUpdated: new Date().toISOString(),
            articles: articles
        };

        logger.logApiSuccess(operation, 200, {
            articleCount: articles.length,
            responseSize: JSON.stringify(response).length
        });

        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            jsonBody: response
        };

    } catch (error) {
        const apiError = error instanceof Error ? error : new Error('Unknown error');
        
        logger.logApiError(operation, apiError, 500, {
            errorDetails: apiError.message,
            stackTrace: apiError.stack?.substring(0, 500) // スタックトレースを制限
        });
        
        return {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            jsonBody: {
                error: 'Failed to fetch articles',
                message: 'Internal server error',
                timestamp: new Date().toISOString(),
                requestId: context.invocationId
            }
        };
    }
}

app.http('articles', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: articles
});