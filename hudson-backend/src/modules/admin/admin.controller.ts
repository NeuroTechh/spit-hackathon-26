import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as adminService from './admin.service';

// GET /admin/stats
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const stats = await adminService.getStats();
        res.json(stats);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// GET /admin/users
export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const search = req.query.search as string | undefined;
        const role = req.query.role as string | undefined;

        const result = await adminService.listAllUsers(page, limit, search, role);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// GET /admin/users/:userId
export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const result = await adminService.getUserDetail(req.params.userId as string);
        res.json(result);
    } catch (err: any) {
        res.status(404).json({ error: err.message });
    }
};

// POST /admin/reports
export const submitReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const { targetUserId, reason, severity, eventId } = req.body;

        if (!targetUserId || !reason) {
            res.status(400).json({ error: 'targetUserId and reason are required' });
            return;
        }

        if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
            res.status(400).json({ error: 'Invalid severity. Must be: low, medium, high, critical' });
            return;
        }

        const report = await adminService.submitReport(
            req.user.userId, targetUserId, reason, severity, eventId
        );
        res.status(201).json(report);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

// PUT /admin/reports/:reportId
export const processReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const { decision, notes } = req.body;

        if (!['apply', 'dismiss'].includes(decision)) {
            res.status(400).json({ error: 'Invalid decision. Must be: apply, dismiss' });
            return;
        }

        const result = await adminService.processReport(
            req.params.reportId as string, decision, req.user.userId, notes
        );
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

// GET /admin/reports
export const listReports = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const status = req.query.status as string | undefined;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

        const result = await adminService.listReports(status, page, limit);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
