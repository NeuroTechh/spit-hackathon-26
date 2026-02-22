import winston from 'winston';
import { Request, Response, NextFunction } from 'express';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${timestamp} [${level}]${message}${metaStr}`;
});

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'HH:mm:ss' }),
        logFormat,
    ),
    transports: [
        new winston.transports.Console({
            format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), logFormat),
        }),
    ],
});

// HTTP request logging middleware
export function httpLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

        logger[level](` ${req.method} ${req.originalUrl} ${status} ${duration}ms`, {
            ...(req.method === 'POST' || req.method === 'PUT' ? { body: sanitizeBody(req.body) } : {}),
        });
    });

    next();
}

// Strip sensitive fields from logged request bodies
function sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
    const sanitized = { ...body };
    const sensitive = ['password', 'secret', 'token', 'otp', 'clientSecret'];
    for (const key of sensitive) {
        if (key in sanitized) sanitized[key] = '[REDACTED]';
    }
    return sanitized;
}
