"use strict";
// RMIT University Vietnam
// Course: COSC2769 - Full Stack Development
// Semester: 2025B
// Assessment: Assignment 02
// Author:
// ID:
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
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!JWT_SECRET) {
            console.error('JWT_SECRET is not defined');
            return res.status(500).json({ message: 'Server configuration error.' });
        }
        const authHeader = req.headers.authorization || '';
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Access denied. No token provided or invalid format.',
            });
        }
        // Extract token safely (supports both slice and split approaches)
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            // console.log('Decoded JWT:', decoded);
        }
        catch (_a) {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
        };
        return next();
    }
    catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});
exports.authMiddleware = authMiddleware;
