import winston from 'winston';
import { Request, Response, NextFunction } from 'express';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]${message}`;
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

export function httpLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
        logger[level](` ${req.method} ${req.originalUrl} ${status} ${duration}ms`);
    });

    next();
}
