import FeedParser from 'feedparser';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { Groq } from 'groq-sdk';
import { CosmosClient, Container, Database } from '@azure/cosmos';
import crypto from 'crypto';
import { Logger, CustomRSSItem, NewsItem, StoredData, ProcessingSummary } from './types';

export class AzureNewsProcessor {
  private groq: Groq;
  private cosmosClient: CosmosClient;
  private database: Database;
  private container: Container;
  private rssUrl: string = 'https://www.microsoft.com/releasecommunications/api/v2/azure/rss';
  private retentionDays: number; // 記事保持期間（日数）

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    // Cosmos DB クライアントの初期化
    const endpoint = process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_DB_KEY;
    const databaseName = process.env.COSMOS_DB_DATABASE_NAME || 'NewsDatabase';
    const containerName = process.env.COSMOS_DB_CONTAINER_NAME || 'Articles';

    // 記事保持期間の設定（環境変数から読み込み、デフォルトは30日）
    this.retentionDays = parseInt(process.env.ARTICLE_RETENTION_DAYS || '30', 10);
    Logger.info(`✅ 記事保持期間: ${this.retentionDays}日 (${this.retentionDays}日より古い記事は削除されます)`);

    if (!endpoint || !key) {
      throw new Error('Cosmos DB endpoint and key must be provided in environment variables');
    }

    this.cosmosClient = new CosmosClient({ endpoint, key });
    this.database = this.cosmosClient.database(databaseName);
    this.container = this.database.container(containerName);
  }

  async fetchRSSFeed(): Promise<CustomRSSItem[]> {
    try {
      Logger.debug(`Fetching RSS from: ${this.rssUrl}`);
      
      const response = await fetch(this.rssUrl, {
        headers: {
          'User-Agent': 'Azure News Digest Bot 1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return new Promise((resolve, reject) => {
        const feedparser = new FeedParser({});
        const items: CustomRSSItem[] = [];
        
        feedparser.on('error', reject);
        feedparser.on('readable', function(this: any) {
          let item;
          while (item = this.read()) {
            Logger.debug(`Processing item: ${item.title}`);
            Logger.debug(`Description length: ${(item.description || '').length}`);
            Logger.debug(`Summary length: ${(item.summary || '').length}`);
            Logger.debug(`Full description:`, item.description);
            
            items.push({
              title: item.title || '',
              link: item.link || '',
              pubDate: item.pubdate || item.date || '',
              description: item.description || item.summary || ''
            });
          }
        });
        
        feedparser.on('end', () => {
          Logger.debug(`Successfully fetched ${items.length} items`);
          resolve(items);
        });
        
        response.body.pipe(feedparser);
      });
    } catch (error) {
      Logger.error('Failed to fetch RSS feed:', error);
      throw error;
    }
  }

  async translateAndSummarize(title: string, content: string): Promise<{
    japaneseTitle: string;
    japaneseDescription: string;
    technicalTags: string[];
    extractedLinks: string[];
  }> {
    try {
      const prompt = `次のAzureアップデート情報を日本語で要約し、技術的な要素を抽出してください。

タイトル: ${title}
内容: ${content}

以下の形式で正確なJSONのみを出力してください:
{
  "japaneseTitle": "日本語のタイトル",
  "japaneseDescription": "- 【概要】このアップデートの目的や変更内容を1〜2文で説明\\n- 【影響・メリット】利用者やシステムへの影響・得られるメリットを1〜2文で説明\\n- 【対応・注意点】必要なアクションや注意すべき点を1〜2文で説明",
  "technicalTags": ["技術的固有名詞1", "技術的固有名詞2"],
  "extractedLinks": []
}

【厳格なルール】
1. 純粋なJSONのみを出力し、その他のコメントや説明は一切含めない
2. japaneseTitle: 元の英文タイトルを自然な日本語で表現する。引用符は必ず半角(")を使用。(翻訳ではなく自分の言葉での要約)
   - タイトルに提供状況が含まれる場合は、以下のルールで冒頭に付与する
     - "Generally Available" または "GA" → 【GA】
     - "Public Preview" → 【パブリックプレビュー】
     - "Private Preview" → 【プライベートプレビュー】
   - 上記に該当しない場合は何も付けない
3. japaneseDescription: 以下の3つの観点で箇条書き要約を作成する（翻訳ではなく自分の言葉での要約）
   - 【概要】: このアップデートが何をするものか・何が変わるかを簡潔に説明
   - 【影響・メリット】: ユーザーやシステムにとっての影響やメリットを説明
   - 【対応・注意点】: 移行作業・設定変更・期限など、読者が取るべきアクションや注意点を説明
   - 各項目は1〜2文にまとめ、原文の直訳は避けて独自の要約にすること
   - 文体は必ず「ですます調」に統一すること（「〜です」「〜ます」「〜できます」「〜なります」等で終える）
   - 「〜した」「〜である」「〜となる」等の常体・体言止めは使用禁止
   - RSS制限で内容が不足する場合はタイトルと文脈から推測して補完する
   - 改行は必ず \\n で表現すること（JSON内のリテラル改行は禁止）
4. technicalTags: 技術的固有名詞のみを英語で抽出
   - 具体的なAzure製品/サービス名（例: "Azure Functions", "Event Hubs", "Azure Storage"）
   - 技術名、プロセッサ名、プログラミング言語名
   - 汎用的な"Azure"や日本語タグは除外
   - 状態表現("プレビュー", "廃止"等)は除外
5. extractedLinks: フルコンテンツが利用可能な場合は含まれるリンクを抽出
   - Microsoft/Azure関連のURL（docs.microsoft.com, learn.microsoft.com, aka.msなど）
   - 移行ガイド、ドキュメント、詳細情報へのリンク
   - RSSの短縮コンテンツにない場合でも、フルコンテンツから積極的に抽出

【特別指示】
- 要約は絶対に完了まで行う。3つの観点すべてを必ず出力すること
- 著作権に配慮し、原文の直訳ではなく自分の言葉での要約にすること
- JSON文字列内の引用符は必ず半角(\")を使用`;

      Logger.debug('Translating with Groq AI...');
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 1500
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('Empty response from Groq API');
      }

      // JSONを抽出する処理
      let jsonText = responseText.trim();
      
      // JSONの開始と終了を見つける
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
      }
      
      Logger.debug('AI Response:', jsonText);
      
      try {
        // JSON文字列内の全角引用符を半角に置換してからパース
        const normalizedJson = jsonText.replace(/[""]/g, '"').replace(/['']/g, "'");
        Logger.debug('Normalized JSON length:', normalizedJson.length);
        const result = JSON.parse(normalizedJson);
        return {
          japaneseTitle: result.japaneseTitle || title,
          japaneseDescription: result.japaneseDescription || content,
          technicalTags: Array.isArray(result.technicalTags) ? result.technicalTags : ['Azure'],
          extractedLinks: Array.isArray(result.extractedLinks) ? result.extractedLinks : []
        };
      } catch (parseError) {
        Logger.error('JSON parse error:', parseError);
        Logger.debug('Raw response:', responseText);
        throw new Error(`Failed to parse JSON response: ${parseError}`);
      }
      
    } catch (error) {
      Logger.error('Translation error:', error);
      // フォールバック
      return {
        japaneseTitle: title,
        japaneseDescription: content,
        technicalTags: ['Azure'],
        extractedLinks: []
      };
    }
  }

  private async loadExistingData(): Promise<StoredData> {
    try {
      // Cosmos DBから既存の記事を取得
      const querySpec = {
        query: "SELECT * FROM c ORDER BY c.date DESC"
      };
      
      const { resources: articles } = await this.container.items.query<NewsItem>(querySpec).fetchAll();
      
      // 保持期間内の記事をフィルタリング
      const recentArticles = this.filterRecentArticles(articles);
      Logger.debug(`Loaded ${articles.length} articles from Cosmos DB, ${recentArticles.length} are recent (within retention period)`);
      
      return {
        lastUpdated: new Date().toISOString(),
        articles: recentArticles
      };
    } catch (error) {
      Logger.error('Error loading data from Cosmos DB:', error);
      
      // Azure Functions環境ではファイルフォールバック無効、空データを返す
      Logger.info('Cosmos DB読み込み失敗時は空데이터で開始します');
      return {
        lastUpdated: new Date().toISOString(),
        articles: []
      };
    }
  }

  private generateUniqueId(link: string): string {
    // タイムスタンプ + URL ハッシュで確実にユニークなIDを生成
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const linkHash = crypto.createHash('md5').update(link).digest('hex').slice(0, 16);
    
    try {
      const url = new URL(link);
      // URLパスから意味のあるIDを作成
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        const urlId = lastPart.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 20);
        return `azure_${urlId}_${linkHash}`; // ハッシュを追加してユニーク性確保
      }
    } catch (error) {
      Logger.debug(`URL parsing failed for ${link}:`, error);
    }
    
    // フォールバック: タイムスタンプ + ハッシュ
    return `azure_article_${timestamp}_${linkHash}`;
  }

  private filterRecentArticles(articles: NewsItem[]): NewsItem[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    return articles.filter(article => {
      const articleDate = new Date(article.date);
      return articleDate >= cutoffDate;
    });
  }

  private filterRecentRSSItems(rssItems: any[]): any[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    return rssItems.filter(item => {
      const itemDate = new Date(item.pubDate || item.isoDate || new Date());
      return itemDate >= cutoffDate;
    });
  }

  /**
   * 保持期間を過ぎた古い記事をCosmos DBから削除する
   */
  private async deleteOldArticles(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      const cutoffDateISO = cutoffDate.toISOString();

      Logger.info(`🗑️ ${this.retentionDays}日より古い記事の削除を開始します (基準日: ${cutoffDate.toLocaleDateString('ja-JP')})`);

      // 古い記事を検索
      const query = "SELECT c.id, c.title, c.date FROM c WHERE c.date < @cutoffDate";
      const { resources: oldArticles } = await this.container.items
        .query({
          query,
          parameters: [
            { name: "@cutoffDate", value: cutoffDateISO }
          ]
        })
        .fetchAll();

      if (oldArticles.length === 0) {
        Logger.info('✅ 削除対象の古い記事はありません');
        return 0;
      }

      Logger.info(`🔍 削除対象の記事: ${oldArticles.length}件`);

      // 古い記事を1件ずつ削除
      let deletedCount = 0;
      for (const article of oldArticles) {
        try {
          await this.container.item(article.id, article.id).delete();
          deletedCount++;
          Logger.debug(`🗑️ 削除: "${article.title}" (発行日: ${new Date(article.date).toLocaleDateString('ja-JP')})`);
        } catch (error) {
          Logger.info(`⚠️ 記事削除エラー [${article.id}]: ${error}`);
        }
      }

      Logger.info(`🗑️ 古い記事削除完了: ${deletedCount}件 / ${oldArticles.length}件`);
      return deletedCount;

    } catch (error) {
      Logger.info(`❌ 古い記事削除エラー: ${error}`);
      return 0;
    }
  }

  async processUpdates(limitCount: number = 100): Promise<ProcessingSummary> {
    const startTime = new Date();
    Logger.info('=== Azure RSS ニュース処理開始 ===');
    Logger.info(`処理開始時刻: ${Logger.getCurrentTime()}`);
    
    // 統計情報の初期化
    const summary: ProcessingSummary = {
      success: false,
      processingTimeMs: 0,
      processingTimeSec: 0,
      startTime: startTime.toISOString(),
      endTime: '',
      rssStats: {
        totalRssItems: 0,
        recentRssItems: 0,
        excludedOldItems: 0,
        processedItems: 0
      },
      articleStats: {
        newArticles: 0,
        skippedExisting: 0,
        deletedOldArticles: 0,
        totalStoredArticles: 0
      },
      databaseStats: {
        cosmosDbOperations: 0,
        successfulWrites: 0,
        failedWrites: 0
      },
      aiStats: {
        groqApiCalls: 0,
        successfulTranslations: 0,
        averageTranslationTimeMs: 0
      },
      configInfo: {
        retentionDays: this.retentionDays,
        limitCount: limitCount,
        rssUrl: this.rssUrl
      },
      errorDetails: []
    };
    
    try {
      // RSSフィードを取得
      Logger.info('RSSフィード取得開始...');
      Logger.info(`取得元URL: ${this.rssUrl}`);
      const rssItems = await this.fetchRSSFeed();
      summary.rssStats.totalRssItems = rssItems.length;
      
      if (rssItems.length === 0) {
        Logger.info('RSSフィードから記事が見つかりませんでした');
        summary.endTime = new Date().toISOString();
        summary.processingTimeMs = new Date().getTime() - startTime.getTime();
        summary.processingTimeSec = Math.round(summary.processingTimeMs / 1000);
        summary.success = true;
        return summary;
      }
      
      // 事前に保持期間内の記事のみフィルタリング（古い記事の処理を回避）
      const recentRssItems = this.filterRecentRSSItems(rssItems);
      summary.rssStats.recentRssItems = recentRssItems.length;
      summary.rssStats.excludedOldItems = rssItems.length - recentRssItems.length;
      Logger.info(`${this.retentionDays}日以内の記事: ${recentRssItems.length}件 (古い記事${rssItems.length - recentRssItems.length}件を除外)`);
      
      if (recentRssItems.length === 0) {
        Logger.info(`処理対象の記事がありません (全て${this.retentionDays}日以上前の古い記事)`);
        summary.endTime = new Date().toISOString();
        summary.processingTimeMs = new Date().getTime() - startTime.getTime();
        summary.processingTimeSec = Math.round(summary.processingTimeMs / 1000);
        summary.success = true;
        return summary;
      }
      
      // 制限を適用
      const itemsToProcess = recentRssItems.slice(0, limitCount);
      summary.rssStats.processedItems = itemsToProcess.length;
      Logger.info(`今回処理対象: 最初の${itemsToProcess.length}件 (制限: ${limitCount}件)`);
      
      // 既存データを読み込み
      Logger.info('既存データを読み込み中...');
      const existingData = await this.loadExistingData();
      summary.articleStats.totalStoredArticles = existingData.articles.length;
      
      // 既存記事のリンク・ID・タイトルをセットに格納（重複チェック強化）
      const existingLinks = new Set(existingData.articles.map(article => article.link));
      const existingTitles = new Set(existingData.articles.map(article => article.title.trim().toLowerCase()));
      
      const newArticles: NewsItem[] = [];
      Logger.info('記事の個別処理を開始...');
      
      let processed = 0;
      let skipped = 0;
      
      for (const item of itemsToProcess) {
        try {
          // 強化された重複チェック（link、タイトル、生成予定ID）
          const normalizedTitle = item.title.trim().toLowerCase();
          const generatedId = this.generateUniqueId(item.link);
          
          if (existingLinks.has(item.link)) {
            skipped++;
            summary.articleStats.skippedExisting++;
            Logger.debug(`スキップ (既存link): ${item.title}`);
            continue;
          }
          
          if (existingTitles.has(normalizedTitle)) {
            skipped++;
            summary.articleStats.skippedExisting++;
            Logger.debug(`スキップ (既存title): ${item.title}`);
            continue;
          }
          
          Logger.info(`処理中 (${processed + 1}/${itemsToProcess.length}): ${item.title}`);
          
          // AI翻訳・要約処理
          const translationStart = Date.now();
          const translated = await this.translateAndSummarize(item.title, item.description);
          const translationTime = Date.now() - translationStart;
          summary.aiStats.groqApiCalls++;
          summary.aiStats.successfulTranslations++;
          summary.aiStats.averageTranslationTimeMs = 
            (summary.aiStats.averageTranslationTimeMs * (summary.aiStats.successfulTranslations - 1) + translationTime) / summary.aiStats.successfulTranslations;
          
          const newsItem: NewsItem = {
            id: generatedId, // 強化されたユニークID生成
            title: item.title,
            link: item.link,
            description: item.description,
            japaneseTitle: translated.japaneseTitle,
            japaneseDescription: translated.japaneseDescription,
            technicalTags: translated.technicalTags,
            extractedLinks: translated.extractedLinks,
            date: item.pubDate || new Date().toISOString()
          };
          
          // Cosmos DBにupsert（重複時は上書き）
          try {
            await this.container.items.upsert(newsItem);
            summary.databaseStats.cosmosDbOperations++;
            summary.databaseStats.successfulWrites++;
            Logger.debug(`Cosmos DB保存成功: ${generatedId}`);
          } catch (dbError) {
            summary.databaseStats.cosmosDbOperations++;
            summary.databaseStats.failedWrites++;
            summary.errorDetails?.push(`Cosmos DB write failed for: ${item.title}`);
            throw dbError;
          }
          
          newArticles.push(newsItem);
          processed++;
          summary.articleStats.newArticles++;
          
          Logger.info(`処理完了 (${processed}/${itemsToProcess.length - skipped}): 技術タグ[${translated.technicalTags.slice(0, 3).join(', ')}${translated.technicalTags.length > 3 ? '...' : ''}]`);
          
        } catch (error) {
          Logger.error(`記事処理エラー [${item.title}]:`, error);
          summary.errorDetails?.push(`Processing failed for: ${item.title} - ${error}`);
          continue; // エラーが発生しても他の記事の処理を継続
        }
      }
      
      if (newArticles.length === 0) {
        Logger.info('処理対象の新しい記事がありませんでした');
        Logger.info(`スキップした記事: ${skipped}件 (既存)`);
        
        // 新しい記事が無くても古い記事の削除は実行する
        Logger.info('=== 古い記事の削除処理 ===');
        const deletedCount = await this.deleteOldArticles();
        
        Logger.info('=== 処理結果サマリー ===');
        Logger.info(`新規処理記事: 0件`);
        Logger.info(`スキップ記事: ${skipped}件 (既存)`);
        Logger.info(`削除記事: ${deletedCount}件 (${this.retentionDays}日以上経過)`);
        Logger.info(`総保存記事数: ${existingData.articles.length}件 (削除前)`);
        
        summary.articleStats.deletedOldArticles = deletedCount;
        summary.endTime = new Date().toISOString();
        summary.processingTimeMs = new Date().getTime() - startTime.getTime();
        summary.processingTimeSec = Math.round(summary.processingTimeMs / 1000);
        summary.success = true;
        return summary;
      }
      
      // 新しい記事を既存データに追加（既に両方とも保持期間フィルタ済み）
      const allArticles = [...existingData.articles, ...newArticles];
      
      // 日付の降順でソート（新しい記事が先頭に）
      allArticles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // データを保存（Cosmos DBに格納済み、ローカルファイルは not needed）
      const updatedData: StoredData = {
        lastUpdated: new Date().toISOString(),
        articles: allArticles
      };
      
      Logger.info('Cosmos DB書き込み完了');
      
      // 古い記事を削除
      Logger.info('=== 古い記事の削除処理 ===');
      const deletedCount = await this.deleteOldArticles();
      summary.articleStats.deletedOldArticles = deletedCount;
      
      const endTime = new Date();
      summary.endTime = endTime.toISOString();
      summary.processingTimeMs = endTime.getTime() - startTime.getTime();
      summary.processingTimeSec = Math.round(summary.processingTimeMs / 1000);
      summary.articleStats.totalStoredArticles = allArticles.length;
      summary.success = true;
      
      Logger.info('=== 処理結果サマリー ===');
      Logger.info(`新規処理記事: ${processed}件`);
      Logger.info(`スキップ記事: ${skipped}件 (既存)`);
      Logger.info(`削除記事: ${deletedCount}件 (${this.retentionDays}日以上経過)`);
      Logger.info(`総保存記事数: ${allArticles.length}件`);
      Logger.info(`処理終了時刻: ${Logger.getCurrentTime()}`);
      Logger.info(`総処理時間: ${summary.processingTimeSec}秒 (${Math.floor(summary.processingTimeSec/60)}分${summary.processingTimeSec%60}秒)`);
      
      
      return summary;
      
    } catch (error) {
      Logger.error('処理中にエラーが発生しました:', error);
      summary.success = false;
      summary.endTime = new Date().toISOString();
      summary.processingTimeMs = new Date().getTime() - startTime.getTime();
      summary.processingTimeSec = Math.round(summary.processingTimeMs / 1000);
      summary.errorDetails?.push(`Fatal error: ${error}`);
      throw error;
    }
  }
}