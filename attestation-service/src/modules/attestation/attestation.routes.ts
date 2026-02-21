import { Router } from 'express';
import * as controller from './attestation.controller';
import { apiKeyAuth } from '../../middleware/apiKey';
import { upload } from '../../middleware/upload';
import { attestLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Submit document for attestation (API key protected)
router.post(
    '/attest',
    apiKeyAuth,
    attestLimiter,
    upload.single('document'),
    controller.submitAttestation
);

// Get attestation by ID (API key protected)
router.get('/attestation/:id', apiKeyAuth, controller.getAttestation);

// Get all attestations for a user (API key protected)
router.get('/attestations/user/:userId', apiKeyAuth, controller.getUserAttestations);

// Get trust score for a user (API key protected)
router.get('/trust-score/:userId', apiKeyAuth, controller.getUserTrustScore);

// Stateless on-chain verification (public)
router.get('/verify/:attestationHash', controller.verifyAttestation);

// Revoke attestation (API key protected)
router.post('/revoke/:attestationHash', apiKeyAuth, controller.revokeAttestation);

export default router;
