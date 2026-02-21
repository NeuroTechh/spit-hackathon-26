import { Router } from 'express';
import * as adminController from './admin.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { auditLog } from '../../middleware/auditLogger';

const router = Router();

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.listUsers);
router.get('/users/:userId', adminController.getUser);
router.get('/reports', adminController.listReports);
router.post('/reports', auditLog('report_submit', 'user'), adminController.submitReport);
router.put('/reports/:reportId', auditLog('report_process', 'user'), adminController.processReport);

export default router;
