import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '50'),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});

export const attestLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Attestation rate limit exceeded. Max 10 per hour.' },
});
