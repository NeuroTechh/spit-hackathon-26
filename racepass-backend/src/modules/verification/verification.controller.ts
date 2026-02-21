import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as verificationService from './verification.service';

export const verifyCredential = async (req: Request, res: Response): Promise<void> => {
    try {
        const credentialHash = req.params.credentialHash as string;
        if (!credentialHash || !/^0x[a-fA-F0-9]{64}$/.test(credentialHash)) {
            res.status(400).json({ error: 'Invalid credential hash' }); return;
        }
        const result = await verificationService.verifyCredentialProof(credentialHash);
        res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
};

export const verifyNFT = async (req: Request, res: Response): Promise<void> => {
    try {
        const walletAddress = req.params.walletAddress as string;
        const eventId = parseInt(req.params.eventId as string);
        const result = await verificationService.verifyNFTOwnership(walletAddress, eventId);
        res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
};

export const verifyReputation = async (req: Request, res: Response): Promise<void> => {
    try {
        const walletAddress = req.params.walletAddress as string;
        const minScore = parseInt(req.query.minScore as string) || 0;
        const result = await verificationService.verifyReputationEligibility(walletAddress, minScore);
        res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
};

export const fullVerification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { walletAddress } = req.body;
        if (!walletAddress) { res.status(400).json({ error: 'walletAddress required' }); return; }
        const result = await verificationService.fullVerification(
            walletAddress,
            req.body.credentialHash,
            req.body.eventId,
            req.body.minReputationScore
        );
        res.json(result);
    } catch (err: any) { res.status(400).json({ error: err.message }); }
};
