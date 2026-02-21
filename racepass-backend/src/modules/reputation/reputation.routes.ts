import { Router } from 'express';
import * as reputationController from './reputation.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { auditLog } from '../../middleware/auditLogger';

const router = Router();

router.get('/score', authenticate, reputationController.getScore);
router.get('/history', authenticate, reputationController.getHistory);
router.post('/action', authenticate, authorize('organizer', 'verifier'), auditLog('reputation_action', 'reputation'), reputationController.recordAction);
router.post('/publish', authenticate, auditLog('reputation_publish', 'reputation'), reputationController.publishOnChain);
router.post('/disclose', authenticate, reputationController.selectiveDisclosure);

export default router;
