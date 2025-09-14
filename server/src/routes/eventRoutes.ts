import { Router } from 'express';
import * as eventController from '../controllers/EventController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, eventController.getEvents);
router.post('/', authMiddleware, eventController.createEvent);
router.patch('/:id', authMiddleware, eventController.updateEvent);
router.delete('/:id', authMiddleware, eventController.deleteEvent);
router.post('/import-ics', authMiddleware, eventController.importICS);
router.get('/today', authMiddleware, eventController.getTodayEvents);

export default router;
