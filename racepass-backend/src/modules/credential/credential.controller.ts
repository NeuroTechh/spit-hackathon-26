import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as credentialService from './credential.service';

export const listCredentials = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Auth required' }); return; }
        const creds = await credentialService.getUserCredentials(req.user.userId);
        res.json({ credentials: creds });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getCredential = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Auth required' }); return; }
        const cred = await credentialService.getCredential(req.params.id as string, req.user.userId);
        res.json(cred);
    } catch (err: any) { res.status(404).json({ error: err.message }); }
};

export const revokeCredential = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Auth required' }); return; }
        const { reason } = req.body;
        const result = await credentialService.revokeCredential(req.params.id as string, req.user.userId, reason || 'User requested');
        res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
};

export const generateProof = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) { res.status(401).json({ error: 'Auth required' }); return; }
        const { proofType } = req.body;
        if (!['over_18', 'kyc_approved', 'not_blacklisted'].includes(proofType)) {
            res.status(400).json({ error: 'Invalid proof type' }); return;
        }
        const result = await credentialService.generateSelectiveProof(req.user.userId, req.user.walletAddress, proofType);
        res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
};

export const verifyCredential = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const credentialHash = req.params.credentialHash as string;
        const result = await credentialService.verifyOnChainCredential(credentialHash);
        res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
};
