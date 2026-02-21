import { Request, Response, NextFunction } from 'express';

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.headers['x-api-key'] as string;
    const expectedKey = process.env.SERVICE_API_KEY;

    if (!expectedKey) {
        res.status(500).json({ error: 'Service API key not configured' });
        return;
    }

    if (!apiKey || apiKey !== expectedKey) {
        res.status(401).json({ error: 'Invalid or missing API key' });
        return;
    }

    next();
};
