import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { auditLog } from '../../middleware/auditLogger';

const router = Router();

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
