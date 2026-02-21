import { Router } from 'express';
import * as eventController from './event.controller';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth';
import { eventLimiter } from '../../middleware/rateLimiter';
import { auditLog } from '../../middleware/auditLogger';

const router = Router();

// Public
router.get('/', optionalAuth, eventController.listEvents);
router.get('/:id', optionalAuth, eventController.getEvent);

// Authenticated
router.get('/:id/eligibility', authenticate, eventController.checkEligibility);
router.post('/:id/mint', authenticate, eventLimiter, auditLog('pass_mint', 'event'), eventController.mintPass);

// Organizer only
router.post('/', authenticate, authorize('organizer', 'verifier'), eventLimiter, auditLog('event_create', 'event'), eventController.createEvent);
router.post('/:id/passes/:passId/checkin', authenticate, authorize('organizer', 'verifier'), auditLog('pass_checkin', 'event'), eventController.checkIn);

export default router;
