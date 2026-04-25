/**
 * Simple structured logger for consistent logging across the application.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: any;
}

class Logger {
    private formatMessage(level: LogLevel, message: string, context?: LogContext | unknown): string {
        const timestamp = new Date().toISOString();
        let contextStr = '';

        if (context !== undefined) {
            if (context instanceof Error) {
                contextStr = ` | Error: ${context.message}\nStack: ${context.stack}`;
            } else if (typeof context === 'object' && context !== null) {
                try {
                    contextStr = ` | Context: ${JSON.stringify(context)}`;
                } catch (e) {
                    contextStr = ` | Context: [Unserializable Object]`;
                }
            } else {
                contextStr = ` | Context: ${String(context)}`;
            }
        }

        return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
    }

    info(message: string, context?: LogContext | unknown): void {
        console.log(this.formatMessage('info', message, context));
    }

    warn(message: string, context?: LogContext | unknown): void {
        console.warn(this.formatMessage('warn', message, context));
    }

    error(message: string, errorOrContext?: LogContext | unknown, additionalContext?: unknown): void {
        // We still use console.error under the hood, but now it's structured and centralized
        let msg = this.formatMessage('error', message, errorOrContext);
        if (additionalContext !== undefined) {
            msg += ` | Additional: ${JSON.stringify(additionalContext)}`;
        }
        console.error(msg);
    }
}

export const logger = new Logger();
