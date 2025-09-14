"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET_TOKEN = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';
// Helper function to validate JWT secret
const validateJWTSecret = () => {
    if (!JWT_SECRET_TOKEN) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    return JWT_SECRET_TOKEN;
};
// Helper function to sign JWT tokens
const signJWT = (payload) => {
    const secret = validateJWTSecret();
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN });
};
exports.signJWT = signJWT;
