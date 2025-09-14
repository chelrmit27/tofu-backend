import {
  validateBody,
  loginSchema,
  userRegistrationSchema,
} from './validationHelper';

export const validateLogin = validateBody(loginSchema);
export const validateCustomerRegistration = validateBody(
  userRegistrationSchema,
);
