import { Router } from 'express';
import * as taskController from '../controllers/TaskController';
import { authMiddleware } from '../middleware/authMiddleware';
const router = Router();

router.get('/', authMiddleware, taskController.getTasks);
router.post('/', authMiddleware, taskController.createTask);
router.patch('/:id', authMiddleware, taskController.updateTask);
router.delete('/:id', authMiddleware, taskController.deleteTask);
router.get('/today', authMiddleware, taskController.getTodayTasks);

export default router;
