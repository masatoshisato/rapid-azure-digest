// Cosmos DBのデータを直接確認するスクリプト
import { CosmosClient, Container, Database } from '@azure/cosmos';
import dotenv from 'dotenv';

// 環境変数を読み込み（プロジェクトルートの .env ファイルを指定）
dotenv.config({ path: '../.env' });

async function checkCosmosData() {
    const endpoint = process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_DB_KEY;
    const databaseName = process.env.COSMOS_DB_DATABASE_NAME;
    const containerName = process.env.COSMOS_DB_CONTAINER_NAME;

    if (!endpoint || !key || !databaseName || !containerName) {
        console.error('❌ Cosmos DB configuration is missing');
        return;
    }

    console.log('🔍 Cosmos DB 接続情報:');
    console.log('Endpoint:', endpoint);
    console.log('Database:', databaseName);
    console.log('Container:', containerName);
    console.log();

    try {
        // Cosmos DBクライアント初期化
        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseName);
        const container = database.container(containerName);

        // 1. 総件数をカウント
        console.log('📊 総件数確認中...');
        const countQuery = {
            query: "SELECT VALUE COUNT(1) FROM c"
        };
        const { resources: countResult } = await container.items.query(countQuery).fetchAll();
        const totalCount = countResult[0] || 0;
        console.log(`総件数: ${totalCount}件`);
        console.log();

        // 2. 最新の5件を表示
        console.log('📰 最新記事5件:');
        const latestQuery = {
            query: "SELECT c.id, c.title, c.date FROM c ORDER BY c.date DESC OFFSET 0 LIMIT 5"
        };
        const { resources: latestArticles } = await container.items.query(latestQuery).fetchAll();
        
        if (latestArticles.length === 0) {
            console.log('❌ 記事が見つかりません');
        } else {
            latestArticles.forEach((article, index) => {
                console.log(`${index + 1}. ${article.title}`);
                console.log(`   ID: ${article.id}`);
                console.log(`   日付: ${article.date}`);
                console.log();
            });
        }

        // 3. 日付別の分布を確認
        console.log('📅 日付別分布:');
        const dateQuery = {
            query: "SELECT c.date, COUNT(1) as count FROM c GROUP BY c.date ORDER BY c.date DESC"
        };
        const { resources: dateGroups } = await container.items.query(dateQuery).fetchAll();
        
        if (dateGroups.length === 0) {
            console.log('❌ 日付データなし');
        } else {
            dateGroups.slice(0, 10).forEach(group => {
                console.log(`${group.date}: ${group.count}件`);
            });
        }

    } catch (error) {
        console.error('❌ Cosmos DB接続エラー:', error);
        
        if (error instanceof Error) {
            const cosmosError = error as any;
            if (cosmosError.code === 401) {
                console.error('認証エラー: API キーを確認してください');
            } else if (cosmosError.code === 404) {
                console.error('リソースが見つかりません: データベースまたはコンテナ名を確認してください');
            }
        }
    }
}

checkCosmosData().catch(console.error);