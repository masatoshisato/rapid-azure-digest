import FeedParser from 'feedparser';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { Groq } from 'groq-sdk';
import fs from 'fs';
import path from 'path';

// ログレベル定義
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO'
}

// ログ管理クラス
class Logger {
  private static logLevel: LogLevel = LogLevel.INFO;
  
  static setLevel(level: LogLevel): void {
    this.logLevel = level;
  }
  
  static debug(message: string, ...args: any[]): void {
    if (this.logLevel === LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
  
  static info(message: string, ...args: any[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }
  
  static error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
  
  static getCurrentTime(): string {
    return new Date().toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}

interface CustomRSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

interface NewsItem {
  title: string;
  link: string;
  description: string;
  japaneseTitle: string;
  japaneseDescription: string;
  technicalTags: string[];
  extractedLinks: string[];
  date: string;
}

interface StoredData {
  lastUpdated: string;
  articles: NewsItem[];
}

class AzureNewsProcessor {
  private groq: Groq;
  private dataDir: string;
  private dataFile: string;
  private rssUrl: string = 'https://www.microsoft.com/releasecommunications/api/v2/azure/rss';

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    
    this.dataDir = path.join(process.cwd(), 'data');
    this.dataFile = path.join(this.dataDir, 'news.json');
    
    // データディレクトリを作成
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
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
      const prompt = `次のAzureアップデート情報を日本語に正確に翻訳し、技術的な要素を抽出してください。

タイトル: ${title}
内容: ${content}

以下の形式で正確なJSONのみを出力してください:
{
  "japaneseTitle": "日本語のタイトル",
  "japaneseDescription": "内容の完全かつ正確な日本語訳",
  "technicalTags": ["技術的固有名詞1", "技術的固有名詞2"],
  "extractedLinks": []
}

【厳格なルール】
1. 純粋なJSONのみを出力し、その他のコメントや説明は一切含めない
2. japaneseTitle: 元のタイトルを自然で正確な日本語に翻訳。引用符は必ず半角(")を使用。
3. japaneseDescription: 内容を適切に翻訳し、必要に応じて補完する
   - RSS制限で切り捨てられた内容はタイトルから推測して補完
   - 繰り返しや無意味な情報は避け、簡潔で有用な情報のみ提供
   - Event Hubs廃止: 代替手段への移行が必要、Azure Monitor Agentは影響なし
   - VMシリーズ: 主要リージョンを含める（繰り返しは不要）
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
- 翻訳は絶対に完了まで行う。文章が途中で終わることは許可しない
- 完全な情報を提供するために、切り捨てられた部分は文脈から補完可能な場合は補完する
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
        const normalizedJson = jsonText.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
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
        Logger.debug('Normalized JSON:', normalizedJson || 'undefined');
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

  private loadExistingData(): StoredData {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf-8');
        const parsedData = JSON.parse(data);
        
        // 読み込み時に古いデータ（365日以前）を削除
        const recentArticles = this.filterRecentArticles(parsedData.articles || []);
        Logger.debug(`Loaded ${parsedData.articles?.length || 0} articles, ${recentArticles.length} are recent (within 365 days)`);
        
        return {
          lastUpdated: parsedData.lastUpdated || new Date().toISOString(),
          articles: recentArticles
        };
      }
    } catch (error) {
      Logger.error('Error loading existing data:', error);
    }
    
    return {
      lastUpdated: new Date().toISOString(),
      articles: []
    };
  }

  private saveData(data: StoredData): void {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
      Logger.debug(`Data saved to ${this.dataFile}`);
    } catch (error) {
      Logger.error('Error saving data:', error);
      throw error;
    }
  }

  private filterRecentArticles(articles: NewsItem[]): NewsItem[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 365); // 365日前

    return articles.filter(article => {
      const articleDate = new Date(article.date);
      return articleDate >= cutoffDate;
    });
  }

  private filterRecentRSSItems(rssItems: any[]): any[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 365); // 365日前

    return rssItems.filter(item => {
      const itemDate = new Date(item.pubDate || item.isoDate || new Date());
      return itemDate >= cutoffDate;
    });
  }

  async processUpdates(limitCount: number = 100): Promise<void> {
    const startTime = new Date();
    Logger.info('=== Azure RSS ニュース処理開始 ===');
    Logger.info(`処理開始時刻: ${Logger.getCurrentTime()}`);
    
    try {
      // RSSフィードを取得
      Logger.info('RSSフィード取得開始...');
      Logger.info(`取得元URL: ${this.rssUrl}`);
      const rssItems = await this.fetchRSSFeed();
      
      if (rssItems.length === 0) {
        Logger.info('RSSフィードから記事が見つかりませんでした');
        return;
      }
      
      Logger.info(`RSS取得完了: ${rssItems.length}件の記事を取得`);

      // 事前に365日以内の記事のみフィルタリング（古い記事の処理を回避）
      const recentRssItems = this.filterRecentRSSItems(rssItems);
      Logger.info(`365日以内の記事: ${recentRssItems.length}件 (古い記事${rssItems.length - recentRssItems.length}件を除外)`);
      
      if (recentRssItems.length === 0) {
        Logger.info('処理対象の記事がありません (全て365日以上前の古い記事)');
        return;
      }

      // 処理件数を制限（デフォルト100件）
      const itemsToProcess = recentRssItems.slice(0, limitCount);
      
      Logger.info(`今回処理対象: 最初の${itemsToProcess.length}件 (制限: ${limitCount}件)`);
      if (recentRssItems.length > limitCount) {
        Logger.info(`注意: ${recentRssItems.length - limitCount}件の記事を切り捨てました（Rate limit対策）`);
      }
      
      // 既存データを読み込み
      Logger.info('既存データを読み込み中...');
      const existingData = this.loadExistingData();
      const existingUrls = new Set(existingData.articles.map(a => a.link));
      
      const newArticles: NewsItem[] = [];
      let processed = 0;
      let skipped = 0;
      
      Logger.info('記事の個別処理を開始...');
      
      for (const item of itemsToProcess) {
        // 既に処理済みの記事はスキップ
        if (existingUrls.has(item.link)) {
          skipped++;
          Logger.debug(`スキップ (既存): ${item.title}`);
          continue;
        }
        
        Logger.info(`処理中 (${processed + 1}/${itemsToProcess.length - skipped}): ${item.title.substring(0, 50)}${item.title.length > 50 ? '...' : ''}`);
        Logger.debug(`RSS記事本文: ${item.description ? item.description.substring(0, 200) + (item.description.length > 200 ? '...' : '') : 'なし'}`);
        Logger.debug(`記事URL: ${item.link}`);
        Logger.debug(`公開日時: ${item.pubDate}`);
        
        // RSSの説明を使用 (フルコンテンツ取得は無効化)
        const contentForAI = item.description;
        Logger.debug(`AI処理用コンテンツ: ${contentForAI ? `${contentForAI.substring(0, 300)}${contentForAI.length > 300 ? '...' : ''}` : 'なし'}`);
        
        // 翻訳・要約処理
        const translated = await this.translateAndSummarize(item.title, contentForAI);
        
        const newsItem: NewsItem = {
          title: item.title,
          link: item.link,
          description: item.description || '',
          japaneseTitle: translated.japaneseTitle,
          japaneseDescription: translated.japaneseDescription,
          technicalTags: translated.technicalTags,
          extractedLinks: translated.extractedLinks || [], // AIが抽出したリンクのみ
          date: item.pubDate || new Date().toISOString()
        };
        
        newArticles.push(newsItem);
        processed++;
        
        Logger.info(`処理完了 (${processed}/${itemsToProcess.length - skipped}): 技術タグ[${translated.technicalTags.slice(0, 3).join(', ')}${translated.technicalTags.length > 3 ? '...' : ''}]`);
        
        // レート制限（3秒間隔）
        const remainingNewItems = itemsToProcess.filter(i => !existingUrls.has(i.link)).length - processed;
        if (remainingNewItems > 0) {
          Logger.debug('3秒待機中 (レート制限)...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      if (newArticles.length === 0) {
        Logger.info('処理対象の新しい記事がありませんでした');
        Logger.info(`スキップした記事: ${skipped}件 (既存)`);
        return;
      }
      
      // 新しい記事を既存データに追加（既に両方とも365日フィルタ済み）
      const allArticles = [...existingData.articles, ...newArticles];
      
      // 日付の降順でソート（新しい記事が先頭に）
      allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // データを保存
      Logger.info('JSONファイルへの書き込み中...');
      const updatedData: StoredData = {
        lastUpdated: new Date().toISOString(),
        articles: allArticles
      };

      this.saveData(updatedData);
      
      const endTime = new Date();
      const processingTimeMs = endTime.getTime() - startTime.getTime();
      const processingTimeSec = Math.round(processingTimeMs / 1000);
      
      Logger.info('JSONファイル書き込み完了');
      Logger.info('=== 処理結果サマリー ===');
      Logger.info(`新規処理記事: ${processed}件`);
      Logger.info(`スキップ記事: ${skipped}件 (既存)`);
      Logger.info(`総保存記事数: ${allArticles.length}件`);
      Logger.info(`処理終了時刻: ${Logger.getCurrentTime()}`);
      Logger.info(`総処理時間: ${processingTimeSec}秒 (${Math.floor(processingTimeSec/60)}分${processingTimeSec%60}秒)`);
      
    } catch (error) {
      Logger.error('処理中にエラーが発生しました:', error);
      throw error;
    }
  }
}

// メイン実行
async function main() {
  // コマンドライン引数を解析
  const args = process.argv.slice(2);
  let limitCount: number | undefined;
  let logLevel: LogLevel = LogLevel.INFO;
  
  // 引数解析
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--debug' || arg === '-d') {
      logLevel = LogLevel.DEBUG;
    } else if (arg === '--log-level') {
      const level = args[i + 1];
      if (level === 'DEBUG' || level === 'debug') {
        logLevel = LogLevel.DEBUG;
        i++; // 次の引数をスキップ
      } else if (level === 'INFO' || level === 'info') {
        logLevel = LogLevel.INFO;
        i++;
      } else {
        Logger.error('Error: Invalid log level. Use DEBUG or INFO');
        process.exit(1);
      }
    } else if (!isNaN(parseInt(arg, 10))) {
      // 数値は制限数として扱う
      const limit = parseInt(arg, 10);
      if (limit < 0) {
        Logger.error('Error: Limit must be a non-negative number');
        printUsage();
        process.exit(1);
      }
      limitCount = limit === 0 ? Number.MAX_SAFE_INTEGER : limit; // 0の場合は実質無制限
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else {
      Logger.error(`Error: Unknown argument: ${arg}`);
      printUsage();
      process.exit(1);
    }
  }
  
  // ログレベルを設定
  Logger.setLevel(logLevel);
  
  // 環境変数チェック
  if (!process.env.GROQ_API_KEY) {
    Logger.error('Error: GROQ_API_KEY environment variable is required');
    Logger.error('Please set it with: export GROQ_API_KEY="your-api-key"');
    process.exit(1);
  }
  
  try {
    const processor = new AzureNewsProcessor();
    await processor.processUpdates(limitCount);
    Logger.info('=== 処理が正常に完了しました ===');
  } catch (error) {
    Logger.error('処理が失敗しました:', error);
    process.exit(1);
  }
}

function printUsage(): void {
  console.log(`
使用方法: npx tsx scripts/update-news.ts [OPTIONS] [LIMIT]

OPTIONS:
  --debug, -d              Debugレベルのログを出力 (詳細情報表示)
  --log-level LEVEL        ログレベルを指定 (DEBUG|INFO)
  --help, -h               このヘルプを表示

ARGUMENTS:
  LIMIT                    処理する記事数の上限 (デフォルト: 100件, 0で全件処理)

例:
  npx tsx scripts/update-news.ts                    # 100件をINFOレベルで処理
  npx tsx scripts/update-news.ts 5                  # 最初の5件をINFOレベルで処理  
  npx tsx scripts/update-news.ts 0                  # 全記事を処理 (Rate limitに注意)
  npx tsx scripts/update-news.ts --debug 3          # 最初の3件をDEBUGレベルで処理
  npx tsx scripts/update-news.ts --log-level DEBUG  # 100件をDEBUGレベルで処理
`);
}

if (require.main === module) {
  main();
}
