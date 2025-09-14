"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskModel = void 0;
const mongoose_1 = require("mongoose");
const taskSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: 'User' },
    date: { type: Date, required: true },
    title: { type: String, required: true },
    categoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'Category',
    },
    categoryName: { type: String, required: false },
    isEvent: { type: Boolean, default: false },
    isReminder: { type: Boolean, default: false },
    start: { type: Date, required: false },
    end: { type: Date, required: false },
    durationMin: { type: Number, required: false },
    done: { type: Boolean, default: false },
    notes: { type: String, required: false },
    carryover: { type: Boolean, default: false }, // Added carryover field
}, {
    timestamps: true,
});
exports.TaskModel = (0, mongoose_1.model)('Task', taskSchema);
