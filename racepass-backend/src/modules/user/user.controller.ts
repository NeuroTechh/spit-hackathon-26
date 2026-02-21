import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as userService from './user.service';

// GET /user/profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const profile = await userService.getUserProfile(req.user.userId);
        res.json(profile);
    } catch (err: any) {
        res.status(404).json({ error: err.message });
    }
};

// PUT /user/profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const result = await userService.updateUserProfile(req.user.userId, req.body);
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

// PUT /user/role/:userId
export const updateRole = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId as string;
        const { role } = req.body;

        if (!['user', 'organizer', 'verifier'].includes(role)) {
            res.status(400).json({ error: 'Invalid role' });
            return;
        }

        const result = await userService.updateUserRole(userId, role);
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
