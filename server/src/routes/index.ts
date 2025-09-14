import { Router } from 'express';

import authRoutes from './authRoutes';
import categoryRoutes from './categoryRoutes';
import eventRoutes from './eventRoutes';
import taskRoutes from './taskRoutes';
import reminderRoutes from './reminderRoutes';
import aggregationRoutes from './aggregationRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/events', eventRoutes);
router.use('/tasks', taskRoutes);
router.use('/reminders', reminderRoutes);
router.use('/aggregation', aggregationRoutes);

export default router;
