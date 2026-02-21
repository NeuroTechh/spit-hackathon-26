import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as reputationService from './reputation.service';

export const getScore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Auth required' }); return; }
        const score = await reputationService.getReputationScore(req.user.userId);
        res.json(score);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const recordAction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Auth required' }); return; }
        const { action, eventId, description } = req.body;
        if (!['attendance', 'checkin_success', 'fraud_attempt', 'no_show'].includes(action)) {
            res.status(400).json({ error: 'Invalid action type' }); return;
        }
        const result = await reputationService.recordAction(req.user.userId, action, eventId, description);
        res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
};

export const publishOnChain = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Auth required' }); return; }
        const result = await reputationService.publishScoreOnChain(req.user.userId);
        res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
};

export const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Auth required' }); return; }
        const limit = parseInt(req.query.limit as string) || 50;
        const history = await reputationService.getReputationHistory(req.user.userId, limit);
        res.json({ history });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const selectiveDisclosure = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Auth required' }); return; }
        const { fields } = req.body;
        if (!Array.isArray(fields)) { res.status(400).json({ error: 'fields must be an array' }); return; }
        const result = await reputationService.getSelectiveReputation(req.user.userId, fields);
        res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
};
