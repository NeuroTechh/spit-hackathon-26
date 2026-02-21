import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as identityService from './identity.service';

// POST /identity/verify/init
export const initVerification = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const { verificationType } = req.body;
        if (!['age', 'kyc', 'blacklist_check'].includes(verificationType)) {
            res.status(400).json({ error: 'Invalid verification type. Must be: age, kyc, blacklist_check' });
            return;
        }

        const result = await identityService.initializeVerification(
            req.user.userId,
            req.user.walletAddress,
            verificationType
        );

        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// POST /identity/verify/callback/:requestId
export const verificationCallback = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const { verificationType, proof } = req.body;
        if (!verificationType || !proof) {
            res.status(400).json({ error: 'verificationType and proof required' });
            return;
        }

        const result = await identityService.processVerificationProof(
            req.user.userId,
            req.user.walletAddress,
            req.user.did,
            verificationType,
            proof
        );

        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

// GET /identity/verifications
export const getVerifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const verifications = await identityService.getUserVerifications(req.user.userId);
        res.json({ verifications });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
