import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { useNonce } from '../config/redis';

// ─── Common Validation Schemas ───────────────────────────────

export const walletAddressSchema = z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address');

export const hashSchema = z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid 32-byte hash');

export const uuidSchema = z
    .string()
    .uuid('Invalid UUID format');

export const nonceSchema = z
    .string()
    .min(16, 'Nonce too short')
    .max(128, 'Nonce too long');

export const signatureSchema = z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature format');

// ─── Request Validation Middleware ───────────────────────────

export const validateBody = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (err) {
            if (err instanceof z.ZodError) {
                res.status(400).json({
                    error: 'Validation failed',
                    details: err.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
                return;
            }
            res.status(400).json({ error: 'Invalid request body' });
        }
    };
};

export const validateParams = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.params = schema.parse(req.params) as any;
            next();
        } catch (err) {
            if (err instanceof z.ZodError) {
                res.status(400).json({
                    error: 'Invalid parameters',
                    details: err.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
                return;
            }
            res.status(400).json({ error: 'Invalid parameters' });
        }
    };
};

export const validateQuery = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.query = schema.parse(req.query) as any;
            next();
        } catch (err) {
            if (err instanceof z.ZodError) {
                res.status(400).json({
                    error: 'Invalid query parameters',
                    details: err.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
                return;
            }
            res.status(400).json({ error: 'Invalid query parameters' });
        }
    };
};

// ─── Replay Attack Protection ────────────────────────────────

export const replayProtection = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const nonce = req.body.nonce || req.headers['x-nonce'];

    if (!nonce) {
        res.status(400).json({ error: 'Nonce required for replay protection' });
        return;
    }

    const isUnused = await useNonce(nonce as string, 300);
    if (!isUnused) {
        res.status(409).json({ error: 'Nonce already used — possible replay attack' });
        return;
    }

    next();
};
