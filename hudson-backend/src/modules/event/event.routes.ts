import { Router } from 'express';
import * as eventController from './event.controller';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth';
// import { eventLimiter } from '../../middleware/rateLimiter';
import { auditLog } from '../../middleware/auditLogger';

const router = Router();

// Public
router.get('/', optionalAuth, eventController.listEvents);

// Authenticated — must be before /:id
router.get('/my-passes', authenticate, eventController.getMyPasses);

router.get('/:id', optionalAuth, eventController.getEvent);

// Authenticated
router.get('/:id/eligibility', authenticate, eventController.checkEligibility);
router.post('/:id/mint', authenticate, auditLog('pass_mint', 'event'), eventController.mintPass);

// Organizer / Admin
router.get('/:id/passes', authenticate, authorize('organizer', 'verifier', 'admin'), eventController.getEventPasses);
router.post('/', authenticate, authorize('organizer', 'verifier', 'admin'), auditLog('event_create', 'event'), eventController.createEvent);
router.post('/:id/passes/:passId/checkin', authenticate, authorize('organizer', 'verifier', 'admin'), auditLog('pass_checkin', 'event'), eventController.checkIn);

export default router;
