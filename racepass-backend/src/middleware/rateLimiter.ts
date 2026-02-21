import rateLimit from 'express-rate-limit';

// ─── General API rate limiter ────────────────────────────────
export const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Auth endpoints (stricter) ───────────────────────────────
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many authentication attempts' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Verification endpoints ──────────────────────────────────
export const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
    message: { error: 'Too many verification attempts, try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Credential operations ───────────────────────────────────
export const credentialLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: { error: 'Too many credential operations' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Event operations ────────────────────────────────────────
export const eventLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Too many event operations' },
    standardHeaders: true,
    legacyHeaders: false,
});
