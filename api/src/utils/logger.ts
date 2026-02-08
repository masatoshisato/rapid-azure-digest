import { InvocationContext } from "@azure/functions";

export interface LogMetadata {
    [key: string]: any;
}

/**
 * プロダクション向け標準化ログクラス
 * 全Azure Functions で使用する共通ログ機能
 */
export class ProductionLogger {
    private context: InvocationContext;
    private requestId: string;
    private requestStart: number;

    constructor(context: InvocationContext) {
        this.context = context;
        this.requestId = context.invocationId;
        this.requestStart = Date.now();
    }

    /**
     * API要求開始時のログ
     */
    logApiStart(operation: string, metadata: LogMetadata = {}) {
        this.context.info(`API request started: ${operation}`, {
            operation,
            status: 'started',
            requestId: this.requestId,
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }

    /**
     * 設定検証成功時のログ  
     */
    logConfigValidation(operation: string, metadata: LogMetadata = {}) {
        this.context.info(`Configuration validated: ${operation}`, {
            operation: `${operation}_config_validated`,
            status: 'success',
            requestId: this.requestId,
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }

    /**
     * 外部サービス接続成功時のログ
     */
    logExternalServiceSuccess(operation: string, service: string, metadata: LogMetadata = {}) {
        const duration = Date.now() - this.requestStart;
        this.context.info(`External service connected: ${service}`, {
            operation: `${operation}_${service}_connected`,
            status: 'success',
            service,
            duration,
            requestId: this.requestId,
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }

    /**
     * データ操作成功時のログ
     */
    logDataOperationSuccess(operation: string, resultCount: number, metadata: LogMetadata = {}) {
        const duration = Date.now() - this.requestStart;
        this.context.info(`Data operation completed: ${operation}`, {
            operation: `${operation}_data_completed`,
            status: 'success',
            resultCount,
            duration,
            requestId: this.requestId,
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }

    /**
     * API要求成功完了時のログ
     */
    logApiSuccess(operation: string, responseStatus: number, metadata: LogMetadata = {}) {
        const duration = Date.now() - this.requestStart;
        this.context.info(`API request completed successfully: ${operation}`, {
            operation: `${operation}_completed`,
            status: 'success',
            responseStatus,
            totalDuration: duration,
            requestId: this.requestId,
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }

    /**
     * 設定エラー時のログ
     */
    logConfigError(operation: string, missingConfigs: string[], metadata: LogMetadata = {}) {
        this.context.error(`Configuration error: ${operation}`, {
            operation: `${operation}_config_error`,
            status: 'failure',
            errorType: 'CONFIGURATION_ERROR',
            missingConfigs,
            requestId: this.requestId,
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }

    /**
     * API要求失敗時のログ
     */
    logApiError(operation: string, error: Error, responseStatus: number, metadata: LogMetadata = {}) {
        const duration = Date.now() - this.requestStart;
        this.context.error(`API request failed: ${operation}`, {
            operation: `${operation}_failed`,
            status: 'failure',
            errorType: error.constructor.name,
            errorMessage: error.message,
            responseStatus,
            totalDuration: duration,
            requestId: this.requestId,
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }

    /**
     * 警告レベルのログ
     */
    logWarning(operation: string, message: string, metadata: LogMetadata = {}) {
        this.context.warn(`Warning: ${operation} - ${message}`, {
            operation: `${operation}_warning`,
            status: 'warning',
            warningMessage: message,
            requestId: this.requestId,
            timestamp: new Date().toISOString(),
            ...metadata
        });
    }

    /**
     * パフォーマンス計測のヘルパー
     */
    getCurrentDuration(): number {
        return Date.now() - this.requestStart;
    }

    /**
     * リクエストIDの取得
     */
    getRequestId(): string {
        return this.requestId;
    }
}