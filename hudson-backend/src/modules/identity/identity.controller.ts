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

// POST /identity/verify/submit/:requestId
export const submitVerification = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!req.user.walletAddress) {
            res.status(400).json({ error: 'Wallet address required. Complete onboarding before verifying identity.' });
            return;
        }

        const { verificationType, docType } = req.body;
        if (!verificationType || !['age', 'kyc', 'blacklist_check'].includes(verificationType)) {
            res.status(400).json({ error: 'Invalid verification type. Must be: age, kyc, blacklist_check' });
            return;
        }

        if (!docType || !['passport', 'aadhaar', 'drivers_license', 'national_id'].includes(docType)) {
            res.status(400).json({ error: 'Invalid document type. Must be: passport, aadhaar, drivers_license, national_id' });
            return;
        }

        const file = req.file;
        if (!file) {
            res.status(400).json({ error: 'Document file is required (field: "document")' });
            return;
        }

        const result = await identityService.submitVerificationDocument(
            req.user.userId,
            req.user.walletAddress,
            req.user.did,
            verificationType,
            docType,
            file.buffer,
            file.mimetype,
            file.originalname
        );

        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

// POST /identity/verify/simple — no file upload, random biased-high score
export const submitVerificationSimple = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!req.user.walletAddress) {
            res.status(400).json({ error: 'Wallet address required. Complete onboarding before verifying identity.' });
            return;
        }

        const { verificationType, docType } = req.body;
        if (!verificationType || !['age', 'kyc', 'blacklist_check'].includes(verificationType)) {
            res.status(400).json({ error: 'Invalid verification type. Must be: age, kyc, blacklist_check' });
            return;
        }

        if (!docType || !['passport', 'aadhaar', 'drivers_license', 'national_id'].includes(docType)) {
            res.status(400).json({ error: 'Invalid document type. Must be: passport, aadhaar, drivers_license, national_id' });
            return;
        }

        const result = await identityService.submitVerificationSimple(
            req.user.userId,
            req.user.walletAddress,
            req.user.did,
            verificationType,
            docType
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
