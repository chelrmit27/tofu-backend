import { Router } from 'express';
import * as categoryController from '../controllers/CategoryController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, categoryController.getCategories);
router.post('/', authMiddleware, categoryController.createCategory);
router.patch('/:id', authMiddleware, categoryController.updateCategory);
router.delete('/:id', authMiddleware, categoryController.deleteCategory);

export default router;
