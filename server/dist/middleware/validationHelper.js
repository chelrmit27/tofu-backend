"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOwnership = exports.validateReminderInput = exports.userRegistrationSchema = exports.loginSchema = exports.validateBody = void 0;
const zod_1 = require("zod");
/**
 * Middleware factory for validating request body using Zod schemas
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
const validateBody = (schema) => {
    return (req, res, next) => {
        console.log('Validation middleware triggered');
        try {
            // Validate and transform the request body
            const validatedData = schema.parse(req.body);
            // Replace request body with validated and transformed data
            req.body = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                // Format Zod validation errors
                const formattedErrors = error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({
                    message: 'Validation failed',
                    errors: formattedErrors,
                });
            }
            // Handle unexpected errors
            console.error('Validation middleware error:', error);
            return res.status(500).json({
                message: 'Internal server error during validation',
            });
        }
    };
};
exports.validateBody = validateBody;
// Username validation: 8-15 characters, letters and digits only
const usernameSchema = zod_1.z
    .string()
    .min(8, 'Username must be at least 8 characters')
    .max(15, 'Username must not exceed 15 characters')
    .regex(/^[a-zA-Z0-9]+$/, 'Username can only contain letters and digits');
// Password validation: 8-20 characters, at least one uppercase, one lowercase, one digit, one special character (!@#$%^&*)
const passwordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(20, 'Password must not exceed 20 characters')
    .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/^(?=.*\d)/, 'Password must contain at least one digit')
    .regex(/^(?=.*[!@#$%^&*])/, 'Password must contain at least one special character (!@#$%^&*)')
    .regex(/^[a-zA-Z0-9!@#$%^&*]+$/, 'Password can only contain letters, digits, and special characters (!@#$%^&*)');
// Email validation
const emailSchema = zod_1.z
    .string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters');
// Generic text field validation (minimum 5 characters)
const textFieldSchema = zod_1.z
    .string()
    .min(5, 'This field must be at least 5 characters')
    .trim();
// Profile picture validation (optional)
const profilePictureSchema = zod_1.z.string().optional().default('');
exports.loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'Username is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.userRegistrationSchema = zod_1.z.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    name: textFieldSchema,
    profilePicture: profilePictureSchema,
});
const validateReminderInput = (data) => {
    const schema = zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required'),
        description: zod_1.z.string().optional(),
        dueDate: zod_1.z.string().optional(),
    });
    schema.parse(data);
};
exports.validateReminderInput = validateReminderInput;
const validateOwnership = (resource, userId) => {
    if (!resource || resource.owner !== userId) {
        throw new Error('Unauthorized access');
    }
};
exports.validateOwnership = validateOwnership;
