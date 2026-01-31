import FeedParser from 'feedparser';
import fetch from 'node-fetch';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Groq } from 'groq-sdk';
import fs from 'fs';
import path from 'path';

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
      console.log(`Fetching RSS from: ${this.rssUrl}`);
      
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
            console.log(`Processing item: ${item.title}`);
            console.log(`Description length: ${(item.description || '').length}`);
            console.log(`Summary length: ${(item.summary || '').length}`);
            console.log(`Full description:`, item.description);
            
            items.push({
              title: item.title || '',
              link: item.link || '',
              pubDate: item.pubdate || item.date || '',
              description: item.description || item.summary || ''
            });
          }
        });
        
        feedparser.on('end', () => {
          console.log(`Successfully fetched ${items.length} items`);
          resolve(items);
        });
        
        response.body.pipe(feedparser);
      });
    } catch (error) {
      console.error('Failed to fetch RSS feed:', error);
      throw error;
    }
  }

  private async fetchFullContent(url: string): Promise<string> {
    try {
      console.log(`Fetching full content from: ${url}`);
      const response = await axios.get(url, {
        timeout: 15000, // 15秒に延長
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Azure-RSS-Processor)'
        },
        maxRedirects: 3 // リダイレクト制限を追加
      });
      
      const $ = cheerio.load(response.data);
      
      // Azureポータルの記事コンテンツを抽出（複数のセレクターを試行）
      let content = '';
      const selectors = [
        '.BlogPostBody',
        '.blog-post-content',
        'article',
        '.content-main',
        '.post-content',
        'main'
      ];
      
      for (const selector of selectors) {
        const element = $(selector);
        if (element.length && element.text().trim().length > 100) {
          content = element.text().trim();
          break;
        }
      }
      
      // フォールバック：bodyから不要な部分を除去
      if (!content) {
        $('script, style, nav, header, footer, aside').remove();
        content = $('body').text().replace(/\s+/g, ' ').trim();
      }
      
      return content.substring(0, 3000); // AI処理のため3000文字に制限
      
    } catch (error) {
      console.error(`Failed to fetch full content from ${url}:`, error);
      return '';
    }
  }

  private extractLinksFromContent(content: string): string[] {
    // URLパターンにマッチするリンクを抽出
    const urlPattern = /https?:\/\/[^\s\)\]]+/g;
    const matches = content.match(urlPattern) || [];
    
    // 重複を除去し、Microsoft/Azure関連のリンクをフィルタリング
    const uniqueLinks = [...new Set(matches)]
      .filter(link => {
        const domain = link.toLowerCase();
        return domain.includes('microsoft.com') || 
               domain.includes('azure.com') || 
               domain.includes('aka.ms') || 
               domain.includes('docs.microsoft.com') ||
               domain.includes('learn.microsoft.com');
      })
      .slice(0, 5); // 最大5個のリンクに制限
      
    return uniqueLinks;
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

      console.log('Translating with Groq AI...');
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
      
      console.log('AI Response:', jsonText);
      
      try {
        // JSON文字列内の全角引用符を半角に置換してからパース
        const normalizedJson = jsonText.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
        console.log('Normalized JSON length:', normalizedJson.length);
        const result = JSON.parse(normalizedJson);
        return {
          japaneseTitle: result.japaneseTitle || title,
          japaneseDescription: result.japaneseDescription || content,
          technicalTags: Array.isArray(result.technicalTags) ? result.technicalTags : ['Azure'],
          extractedLinks: Array.isArray(result.extractedLinks) ? result.extractedLinks : []
        };
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Normalized JSON:', normalizedJson || 'undefined');
        console.error('Raw response:', responseText);
        throw new Error(`Failed to parse JSON response: ${parseError}`);
      }
      
    } catch (error) {
      console.error('Translation error:', error);
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
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
    
    return {
      lastUpdated: new Date().toISOString(),
      articles: []
    };
  }

  private saveData(data: StoredData): void {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
      console.log(`Data saved to ${this.dataFile}`);
    } catch (error) {
      console.error('Error saving data:', error);
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

  async processUpdates(limitCount?: number): Promise<void> {
    console.log('Starting Azure updates processing...');
    
    try {
      // RSSフィードを取得
      const rssItems = await this.fetchRSSFeed();
      
      if (rssItems.length === 0) {
        console.log('No articles found in RSS feed');
        return;
      }

      // 処理件数を制限
      const itemsToProcess = limitCount ? rssItems.slice(0, limitCount) : rssItems;
      
      if (limitCount) {
        console.log(`Processing first ${itemsToProcess.length} articles (limit: ${limitCount})...`);
      } else {
        console.log(`Processing ${itemsToProcess.length} articles...`);
      }
      
      // 既存データを読み込み
      const existingData = this.loadExistingData();
      const existingUrls = new Set(existingData.articles.map(a => a.link));
      
      const newArticles: NewsItem[] = [];
      let processed = 0;
      
      for (const item of itemsToProcess) {
        // 既に処理済みの記事はスキップ
        if (existingUrls.has(item.link)) {
          continue;
        }
        
        console.log(`Processing (${processed + 1}): ${item.title}`);
        
        // フルコンテンツを取得
        let fullContent = '';
        let extractedLinks: string[] = [];
        
        if (item.link) {
          fullContent = await this.fetchFullContent(item.link);
          extractedLinks = this.extractLinksFromContent(fullContent);
          
          console.log(`Full content length: ${fullContent.length}`);
          if (extractedLinks.length > 0) {
            console.log(`Extracted links: ${extractedLinks.join(', ')}`);
          }
        }
        
        // フルコンテンツまたはRSSの説明を使用
        const contentForAI = fullContent || item.description;
        
        // 翻訳・要約処理
        const translated = await this.translateAndSummarize(item.title, contentForAI);
        
        // 抽出したリンクとAIが抽出したリンクをマージ
        const allExtractedLinks = [
          ...extractedLinks, 
          ...(translated.extractedLinks || [])
        ].filter((link, index, arr) => arr.indexOf(link) === index); // 重複除去
        
        const newsItem: NewsItem = {
          title: item.title,
          link: item.link,
          description: item.description || '',
          japaneseTitle: translated.japaneseTitle,
          japaneseDescription: translated.japaneseDescription,
          technicalTags: translated.technicalTags,
          extractedLinks: allExtractedLinks,
          date: item.pubDate || new Date().toISOString()
        };
        
        newArticles.push(newsItem);
        processed++;
        
        // レート制限（3秒間隔）
        const remainingNewItems = itemsToProcess.filter(i => !existingUrls.has(i.link)).length - processed;
        if (remainingNewItems > 0) {
          console.log('Waiting 3 seconds for rate limiting...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      if (newArticles.length === 0) {
        console.log('No new articles to process');
        return;
      }
      
      // 新しい記事を既存データに追加
      const allArticles = [...existingData.articles, ...newArticles];
      
      // 365日以内の記事のみ保持
      const filteredArticles = this.filterRecentArticles(allArticles);
      
      // データを保存
      const updatedData: StoredData = {
        lastUpdated: new Date().toISOString(),
        articles: filteredArticles
      };
      
      this.saveData(updatedData);
      
      console.log(`Successfully processed ${processed} new articles`);
      console.log(`Total articles in storage: ${filteredArticles.length}`);
      
    } catch (error) {
      console.error('Error during processing:', error);
      throw error;
    }
  }
}

// メイン実行
async function main() {
  if (!process.env.GROQ_API_KEY) {
    console.error('Error: GROQ_API_KEY environment variable is required');
    console.error('Please set it with: export GROQ_API_KEY="your-api-key"');
    process.exit(1);
  }
  
  // コマンドライン引数を解析
  let limitCount: number | undefined;
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const limit = parseInt(args[0], 10);
    if (isNaN(limit) || limit <= 0) {
      console.error('Error: Limit must be a positive number');
      console.error('Usage: npm run update-news [limit]');
      console.error('Example: npm run update-news 5');
      process.exit(1);
    }
    limitCount = limit;
  }
  
  try {
    const processor = new AzureNewsProcessor();
    await processor.processUpdates(limitCount);
    console.log('Processing completed successfully!');
  } catch (error) {
    console.error('Processing failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
