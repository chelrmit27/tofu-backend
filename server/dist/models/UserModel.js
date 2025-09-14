"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, unique: false },
    profilePicture: { type: String, required: false },
    preferences: {
        timezone: { type: String, default: 'Asia/Ho_Chi_Minh' },
        dailyBudgetMin: { type: Number, default: 720 },
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system',
        },
    },
}, {
    timestamps: true,
});
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
