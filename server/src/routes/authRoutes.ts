import { Router } from 'express';
import * as authController from '../controllers/AuthController';
import {
  validateCustomerRegistration,
  validateLogin,
} from '../middleware/authValidationMiddleware';
const router = Router();

// Registration routes with validation
router.post(
  '/register/user',
  validateCustomerRegistration,
  authController.register,
);

router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);

export default router;
