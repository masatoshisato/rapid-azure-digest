// ログレベル定義
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO'
}

// ログ管理クラス
export class Logger {
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

export interface CustomRSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

export interface NewsItem {
  id?: string; // Cosmos DB用のユニークID
  title: string;
  link: string;
  description: string;
  japaneseTitle: string;
  japaneseDescription: string;
  technicalTags: string[];
  extractedLinks: string[];
  date: string;
}

export interface StoredData {
  lastUpdated: string;
  articles: NewsItem[];
}

// 処理結果のサマリー情報
export interface ProcessingSummary {
  success: boolean;
  processingTimeMs: number;
  processingTimeSec: number;
  startTime: string;
  endTime: string;
  rssStats: {
    totalRssItems: number;
    recentRssItems: number;
    excludedOldItems: number;
    processedItems: number;
  };
  articleStats: {
    newArticles: number;
    skippedExisting: number;
    deletedOldArticles: number;
    totalStoredArticles: number;
  };
  databaseStats: {
    cosmosDbOperations: number;
    successfulWrites: number;
    failedWrites: number;
  };
  aiStats: {
    groqApiCalls: number;
    successfulTranslations: number;
    averageTranslationTimeMs: number;
  };
  configInfo: {
    retentionDays: number;
    limitCount: number;
    rssUrl: string;
  };
  errorDetails?: string[];
}