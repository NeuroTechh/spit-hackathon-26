import { Router } from 'express';
import * as identityController from './identity.controller';
import { authenticate } from '../../middleware/auth';
import { verifyLimiter } from '../../middleware/rateLimiter';
import { auditLog } from '../../middleware/auditLogger';

const router = Router();

// Initialize verification request (get Reclaim Protocol URL)
router.post(
    '/verify/init',
    authenticate,
    verifyLimiter,
    auditLog('identity_verification_init', 'credential'),
    identityController.initVerification
);

// Process verification callback (submit proof)
router.post(
    '/verify/callback/:requestId',
    authenticate,
    verifyLimiter,
    auditLog('identity_verification_complete', 'credential'),
    identityController.verificationCallback
);

// Get user's verifications
router.get('/verifications', authenticate, identityController.getVerifications);

export default router;
