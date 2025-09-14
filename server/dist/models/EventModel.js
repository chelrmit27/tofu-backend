"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventModel = void 0;
const mongoose_1 = require("mongoose");
const eventSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    location: { type: String, required: false },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    allDay: { type: Boolean, default: false },
    notes: { type: String, required: false },
    source: { type: String, enum: ['manual', 'ics'], default: 'manual' },
    icsUid: { type: String, required: false },
}, {
    timestamps: true,
});
exports.EventModel = (0, mongoose_1.model)('Event', eventSchema);
