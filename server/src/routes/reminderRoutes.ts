import { Router } from 'express';
import * as reminderController from '../controllers/ReminderController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, reminderController.getReminders);
router.post('/', authMiddleware, reminderController.createReminder);
router.patch('/:id', authMiddleware, reminderController.updateReminder);
router.delete('/:id', authMiddleware, reminderController.deleteReminder);
router.post(
  '/:id/convert-to-task',
  authMiddleware,
  reminderController.convertToTask,
);

export default router;
