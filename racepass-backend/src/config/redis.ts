import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
        if (times > 3) {
            console.error('Redis connection failed after 3 retries');
            return null;
        }
        return Math.min(times * 200, 2000);
    },
});

redis.on('connect', () => {
    console.log('  ✅ Redis connected');
});

redis.on('error', (err) => {
    console.error('Redis error:', err.message);
});

// ─── Session helpers ─────────────────────────────────────────

export const setSession = async (
    key: string,
    data: Record<string, any>,
    ttlSeconds: number = 86400
): Promise<void> => {
    await redis.set(`session:${key}`, JSON.stringify(data), 'EX', ttlSeconds);
};

export const getSession = async (key: string): Promise<Record<string, any> | null> => {
    const data = await redis.get(`session:${key}`);
    return data ? JSON.parse(data) : null;
};

export const deleteSession = async (key: string): Promise<void> => {
    await redis.del(`session:${key}`);
};

// ─── Cache helpers ───────────────────────────────────────────

export const setCache = async (
    key: string,
    data: any,
    ttlSeconds: number = 300
): Promise<void> => {
    await redis.set(`cache:${key}`, JSON.stringify(data), 'EX', ttlSeconds);
};

export const getCache = async (key: string): Promise<any | null> => {
    const data = await redis.get(`cache:${key}`);
    return data ? JSON.parse(data) : null;
};

export const invalidateCache = async (pattern: string): Promise<void> => {
    const keys = await redis.keys(`cache:${pattern}`);
    if (keys.length > 0) {
        await redis.del(...keys);
    }
};

// ─── Nonce helpers (replay protection) ───────────────────────

export const useNonce = async (nonce: string, ttlSeconds: number = 300): Promise<boolean> => {
    const result = await redis.set(`nonce:${nonce}`, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK'; // true if nonce was unused, false if replay
};

export default redis;
