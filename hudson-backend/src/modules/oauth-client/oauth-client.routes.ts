import { Router } from 'express';
import * as oauthClientController from './oauth-client.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication — ownership is enforced in the service layer
router.use(authenticate);

router.get('/', oauthClientController.list);
router.get('/:id', oauthClientController.get);
router.post('/', oauthClientController.create);
router.put('/:id', oauthClientController.update);
router.delete('/:id', oauthClientController.remove);
router.post('/:id/rotate-secret', oauthClientController.rotateSecret);

export default router;
