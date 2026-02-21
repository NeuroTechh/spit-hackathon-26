import { Router } from 'express';
import * as credentialController from './credential.controller';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { credentialLimiter } from '../../middleware/rateLimiter';
import { auditLog } from '../../middleware/auditLogger';

const router = Router();

// List user's credentials
router.get('/', authenticate, credentialController.listCredentials);

// Get single credential
router.get('/:id', authenticate, credentialController.getCredential);

// Revoke a credential
router.post(
    '/:id/revoke',
    authenticate,
    credentialLimiter,
    auditLog('credential_revoke', 'credential'),
    credentialController.revokeCredential
);

// Generate selective disclosure proof
router.post(
    '/proof/generate',
    authenticate,
    credentialLimiter,
    auditLog('proof_generate', 'credential'),
    credentialController.generateProof
);

// Verify credential on-chain (public endpoint)
router.get(
    '/verify/:credentialHash',
    optionalAuth,
    credentialController.verifyCredential
);

export default router;
