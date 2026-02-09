// 実際のURLパターンを確認するスクリプト
import { CosmosClient } from '@azure/cosmos';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function checkURLs() {
    const endpoint = process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_DB_KEY;
    const databaseName = process.env.COSMOS_DB_DATABASE_NAME;
    const containerName = process.env.COSMOS_DB_CONTAINER_NAME;

    if (!endpoint || !key || !databaseName || !containerName) {
        console.error('環境変数が設定されていません');
        return;
    }

    const client = new CosmosClient({ endpoint, key });
    const database = client.database(databaseName);
    const container = database.container(containerName);

    // すべての記事のID、URL、タイトルを取得
    const query = {
        query: "SELECT c.id, c.link, c.title FROM c ORDER BY c.date DESC"
    };

    const { resources: articles } = await container.items.query(query).fetchAll();

    console.log('📰 記事のURL分析:');
    articles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title.substring(0, 60)}...`);
        console.log(`   ID: ${article.id}`);
        console.log(`   URL: ${article.link}`);
        
        // IDを生成して確認
        const expectedId = Buffer.from(article.link).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
        console.log(`   Expected ID: ${expectedId}`);
        console.log('');
    });
}

checkURLs().catch(console.error);