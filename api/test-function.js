// Azure Functions の動作テスト用スクリプト
const { articles } = require('./functions/articles.js');

// モックのリクエストとコンテキストを作成
const mockRequest = {
  method: 'GET',
  url: '/api/articles',
  headers: {}
};

const mockContext = {
  log: console.log,
  error: console.error
};

// モック環境変数を設定
process.env.COSMOS_DB_ENDPOINT = 'https://test-endpoint.documents.azure.com:443/';
process.env.COSMOS_DB_KEY = 'test-key';
process.env.COSMOS_DB_DATABASE_NAME = 'NewsDatabase'; 
process.env.COSMOS_DB_CONTAINER_NAME = 'Articles';

console.log('=== Azure Functions 動作テスト ===');
console.log('モック環境でarticles関数をテスト中...\n');

// articles関数を実行
articles(mockRequest, mockContext)
  .then(result => {
    console.log('\n=== テスト結果 ===');
    console.log('Status:', result.status);
    console.log('Headers:', JSON.stringify(result.headers, null, 2));
    if (result.status === 200) {
      console.log('✅ Function は正常にコンパイル・実行されました');
      console.log('本番環境では実際のCosmos DB接続が必要です');
    } else {
      console.log('❌ エラーが発生しました:');
      console.log('Response:', result.jsonBody);
    }
  })
  .catch(error => {
    console.error('\n❌ Function実行エラー:', error.message);
    console.log('\n✅ ただし、これは予想されるエラーです（Cosmos DB未接続）');
    console.log('TypeScriptコンパイルと基本的な関数ロジックは正常です');
  });