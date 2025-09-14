import { Router } from 'express';
import * as aggregationController from '../controllers/AggregationController';
import { authMiddleware } from '../middleware/authMiddleware';
const router = Router();

router.get('/day/summary', authMiddleware, aggregationController.getDaySummary);
router.get(
  '/trends/weekly',
  authMiddleware,
  aggregationController.getWeeklyTrends,
);
router.post(
  '/analytics/weekly/update',
  authMiddleware,
  aggregationController.updateWeeklyAnalytics,
);
router.get(
  '/analytics/weekly',
  authMiddleware,
  aggregationController.getWeeklyAnalytics,
);

export default router;
