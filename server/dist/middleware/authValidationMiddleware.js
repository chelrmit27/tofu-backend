"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCustomerRegistration = exports.validateLogin = void 0;
const validationHelper_1 = require("./validationHelper");
exports.validateLogin = (0, validationHelper_1.validateBody)(validationHelper_1.loginSchema);
exports.validateCustomerRegistration = (0, validationHelper_1.validateBody)(validationHelper_1.userRegistrationSchema);
