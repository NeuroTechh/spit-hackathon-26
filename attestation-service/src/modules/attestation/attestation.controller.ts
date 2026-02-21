import { Request, Response } from 'express';
import * as attestationService from './attestation.service';
import { getTrustScore } from '../trust/trust.service';
import { AttestRequestSchema } from '../../utils/validators';

// POST /api/v1/attest
export const submitAttestation = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = AttestRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
            return;
        }

        const { userId, walletAddress, docType } = parsed.data;
        const file = req.file;

        if (!file) {
            res.status(400).json({ error: 'Document file is required' });
            return;
        }

        const result = await attestationService.createAttestation(
            userId,
            walletAddress,
            docType,
            file.buffer,
            file.mimetype
        );

        res.status(201).json(result);
    } catch (err: any) {
        console.error('Attestation submission failed:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// GET /api/v1/attestation/:id
export const getAttestation = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const attestation = await attestationService.getAttestation(id);
        if (!attestation) {
            res.status(404).json({ error: 'Attestation not found' });
            return;
        }
        res.json(attestation);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/v1/attestations/user/:userId
export const getUserAttestations = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId as string;
        const attestations = await attestationService.getUserAttestations(userId);
        res.json({ attestations });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/v1/trust-score/:userId
export const getUserTrustScore = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId as string;
        const score = await getTrustScore(userId);
        if (!score) {
            res.json({
                userId,
                aggregateScore: 0,
                attestationCount: 0,
                highestDocTier: null,
            });
            return;
        }
        res.json(score);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/v1/verify/:attestationHash
export const verifyAttestation = async (req: Request, res: Response): Promise<void> => {
    try {
        const hash = req.params.attestationHash as string;
        const result = await attestationService.verifyOnChain(hash);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/v1/revoke/:attestationHash
export const revokeAttestation = async (req: Request, res: Response): Promise<void> => {
    try {
        const hash = req.params.attestationHash as string;
        const result = await attestationService.revokeAttestation(hash);
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
