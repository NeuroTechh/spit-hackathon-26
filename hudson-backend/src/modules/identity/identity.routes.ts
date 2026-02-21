import { Router } from 'express';
import multer from 'multer';
import * as identityController from './identity.controller';
import { authenticate } from '../../middleware/auth';
import { verifyLimiter } from '../../middleware/rateLimiter';
import { auditLog } from '../../middleware/auditLogger';

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, WebP, and PDF files are accepted'));
        }
    },
});

// Initialize verification request (get document upload instructions)
router.post(
    '/verify/init',
    authenticate,
    verifyLimiter,
    auditLog('identity_verification_init', 'credential'),
    identityController.initVerification
);

// Submit document for verification (replaces Reclaim callback)
router.post(
    '/verify/submit/:requestId',
    authenticate,
    verifyLimiter,
    upload.single('document'),
    auditLog('identity_verification_submit', 'credential'),
    identityController.submitVerification
);

// Submit verification without file upload (random biased-high score)
router.post(
    '/verify/simple',
    authenticate,
    verifyLimiter,
    auditLog('identity_verification_simple', 'credential'),
    identityController.submitVerificationSimple
);

// Get user's verifications
router.get('/verifications', authenticate, identityController.getVerifications);

export default router;
