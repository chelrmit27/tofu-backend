"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const UserModel_1 = require("../models/UserModel");
const UserServices_1 = require("../services/UserServices");
const SignHelper_1 = require("../utils/SignHelper");
const validationHelper_1 = require("../middleware/validationHelper");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Register endpoint hit');
    try {
        // Validate the request body using Zod schema
        const validationResult = validationHelper_1.userRegistrationSchema.safeParse(req.body);
        if (!validationResult.success) {
            const formattedErrors = validationResult.error.issues.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            }));
            console.log('Error validating');
            return res.status(400).json({
                message: 'Validation failed',
                errors: formattedErrors,
            });
        }
        const { username, email, password, name, profilePicture } = validationResult.data;
        // Check if username already exists
        const existingUser = yield UserServices_1.UserServices.usernameExists(username);
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists' });
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 12);
        const user = new UserModel_1.UserModel({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            passwordHash: hashedPassword,
            name: name.trim(),
            profilePicture,
            preferences: {
                timezone: 'Asia/Ho_Chi_Minh',
                dailyBudgetMin: 720,
                theme: 'system',
            },
        });
        console.log('user:', user);
        yield user.save();
        const tokenPayload = {
            userId: user.id.toString(),
            username: user.username,
        };
        const token = (0, SignHelper_1.signJWT)(tokenPayload);
        res.status(201).json({
            message: 'Customer registered successfully',
            customer: {
                id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                profilePicture: user.profilePicture,
            },
            token,
        });
    }
    catch (error) {
        console.error('User Registration Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate the request body using Zod schema
        const validationResult = validationHelper_1.loginSchema.safeParse(req.body);
        if (!validationResult.success) {
            const formattedErrors = validationResult.error.issues.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            }));
            return res.status(400).json({
                message: 'Validation failed',
                errors: formattedErrors,
            });
        }
        const { username, password } = validationResult.data;
        const user = yield UserServices_1.UserServices.findByUserName(username);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const tokenPayload = {
            userId: user.id.toString(),
            username: user.username,
        };
        const token = (0, SignHelper_1.signJWT)(tokenPayload);
        const userData = {
            id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
        };
        return res
            .status(200)
            .json({ message: 'Login successful', user: userData, token });
    }
    catch (err) {
        console.error('Login Error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.login = login;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.status(200).json({
            message: 'Logout successful',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.logout = logout;
