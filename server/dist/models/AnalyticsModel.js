"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModel = void 0;
const mongoose_1 = require("mongoose");
const DailyAnalyticsSchema = new mongoose_1.Schema({
    date: { type: String, required: true }, // '2025-09-11'
    spentMin: { type: Number, required: true },
    taskMinutes: { type: Number, required: true },
    eventMinutes: { type: Number, required: true },
    productiveMinutes: { type: Number, required: true },
    byCategory: [
        {
            categoryId: String,
            name: String,
            minutes: Number,
        },
    ],
});
const AnalyticsSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: String, required: true }, // e.g., '2025-09-09' (Monday)
    daily: [DailyAnalyticsSchema],
    totalMinutes: Number,
    byCategory: [
        {
            categoryId: String,
            name: String,
            minutes: Number,
        },
    ],
    focusRatio: {
        activeMin: Number,
        restMin: Number,
    },
    streak: Number,
});
exports.AnalyticsModel = (0, mongoose_1.model)('Analytics', AnalyticsSchema);
