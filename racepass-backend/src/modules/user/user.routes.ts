import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import { auditLog } from '../../middleware/auditLogger';
import { replayProtection } from '../../middleware/validation';

const router = Router();

// ─── Public Auth Routes ──────────────────────────────────────

// Step 1: Get nonce for wallet
router.post('/auth/nonce', authLimiter, userController.getNonce);

// Step 2: Verify signature and get JWT
router.post(
    '/auth/verify',
    authLimiter,
    auditLog('wallet_login', 'user'),
    userController.verifySignature
);

// ─── Authenticated Routes ────────────────────────────────────

// Get own profile
router.get('/profile', authenticate, userController.getProfile);

// Update own profile
router.put('/profile', authenticate, userController.updateProfile);

// Update user role (verifier only)
router.put(
    '/role/:userId',
    authenticate,
    authorize('verifier'),
    auditLog('role_update', 'user'),
    userController.updateRole
);

export default router;
