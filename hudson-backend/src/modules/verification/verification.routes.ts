import { Router } from 'express';
import * as verificationController from './verification.controller';

const router = Router();

// All verification endpoints are PUBLIC — stateless, no PII

// Verify a credential proof by hash
router.get('/credential/:credentialHash', verificationController.verifyCredential);

// Verify NFT ownership for an event
router.get('/nft/:walletAddress/:eventId', verificationController.verifyNFT);

// Verify reputation eligibility
router.get('/reputation/:walletAddress', verificationController.verifyReputation);

// Full verification bundle (credential + NFT + reputation)
router.post('/full', verificationController.fullVerification);

export default router;
