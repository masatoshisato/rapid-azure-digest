import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from '@azure/cosmos';

export async function articles(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        context.log('Starting articles function...');
        
        // Cosmos DB接続設定
        const endpoint = process.env.COSMOS_DB_ENDPOINT;
        const key = process.env.COSMOS_DB_KEY;
        const databaseName = process.env.COSMOS_DB_DATABASE_NAME;
        const containerName = process.env.COSMOS_DB_CONTAINER_NAME;

        context.log('Environment variables:', {
            endpoint: endpoint ? 'SET' : 'NOT SET',
            key: key ? 'SET' : 'NOT SET', 
            databaseName,
            containerName
        });

        // 実際の値をログ出力（デバッグ用）
        context.log('DEBUG - Actual environment variable values:');
        context.log('COSMOS_DB_ENDPOINT:', endpoint);
        context.log('COSMOS_DB_KEY (first 20 chars):', key ? key.substring(0, 20) + '...' : 'NOT SET');
        context.log('COSMOS_DB_DATABASE_NAME:', databaseName);
        context.log('COSMOS_DB_CONTAINER_NAME:', containerName);

        if (!endpoint || !key || !databaseName || !containerName) {
            throw new Error('Cosmos DB configuration is missing');
        }

        context.log('Attempting to connect to Cosmos DB...');
        context.log('DEBUG - Creating CosmosClient with endpoint:', endpoint);

        // Cosmos DBクライアント初期化
        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseName);
        const container = database.container(containerName);

        context.log('Connected to Cosmos DB, querying for articles...');

        // 全記事を取得（日付順で降順）
        const querySpec = {
            query: "SELECT * FROM c ORDER BY c.date DESC"
        };

        const { resources: articles } = await container.items
            .query(querySpec)
            .fetchAll();

        context.log(`Fetched ${articles.length} articles from Cosmos DB`);

        // レスポンス形式を既存のJSONファイルと同じにする
        const response = {
            lastUpdated: new Date().toISOString(),
            articles: articles
        };

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
        context.error('Error fetching articles:', error);
        
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
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        };
    }
}

app.http('articles', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: articles
});