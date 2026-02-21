import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth, getOrCreateRacepassUser } from '../auth';

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

// ─── Authenticate via Better-Auth Session ────────────────────

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // Bridge to Racepass user
        const racepassUser = await getOrCreateRacepassUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
        });

        req.user = {
            userId: racepassUser.id,
            walletAddress: racepassUser.wallet_address || '',
            did: racepassUser.did,
            role: racepassUser.role,
        };

        next();
    } catch (err) {
        console.error('Authentication error:', err);
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
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (session) {
            const racepassUser = await getOrCreateRacepassUser({
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
            });

            req.user = {
                userId: racepassUser.id,
                walletAddress: racepassUser.wallet_address || '',
                did: racepassUser.did,
                role: racepassUser.role,
            };
        }
    } catch {
        // Silently ignore for optional auth
    }
    next();
};
