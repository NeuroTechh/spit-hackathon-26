import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getSession } from '../config/redis';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// ─── Types ───────────────────────────────────────────────────

export interface AuthPayload {
    userId: string;
    walletAddress: string;
    did: string;
    role: 'user' | 'organizer' | 'verifier';
}

export interface AuthRequest extends Request {
    user?: AuthPayload;
}

// ─── Generate JWT ────────────────────────────────────────────

export const generateToken = (payload: AuthPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: AuthPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    } as jwt.SignOptions);
};

// ─── Verify JWT Middleware ───────────────────────────────────

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;

        // Check if session still exists in Redis (allows logout/invalidation)
        const session = await getSession(`jwt:${decoded.userId}`);
        if (!session) {
            res.status(401).json({ error: 'Session expired or invalidated' });
            return;
        }

        req.user = decoded;
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        if (err instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        res.status(500).json({ error: 'Authentication error' });
    }
};

// ─── Role-based Access Control ───────────────────────────────

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        next();
    };
};

// ─── Optional Auth (doesn't fail if no token) ────────────────

export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
            req.user = decoded;
        }
    } catch {
        // Silently ignore invalid tokens for optional auth
    }
    next();
};
