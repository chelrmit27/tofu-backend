"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderModel = void 0;
const mongoose_1 = require("mongoose");
const reminderSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String, required: false },
    dueAt: { type: Date, required: false },
    notes: { type: String, required: false },
}, {
    timestamps: true,
});
exports.ReminderModel = (0, mongoose_1.model)('Reminder', reminderSchema);
