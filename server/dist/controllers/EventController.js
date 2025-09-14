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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayEvents = exports.importICS = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEvents = void 0;
const EventModel_1 = require("../models/EventModel");
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
const eventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(240),
    start: zod_1.z.string(),
    end: zod_1.z.string(),
    allDay: zod_1.z.boolean().optional(),
    location: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
const getEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { from, to } = req.query;
        if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
            return res.status(400).json({ message: 'Invalid date range' });
        }
        const fromDate = new Date(from);
        const toDate = new Date(to);
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }
        if (toDate <= fromDate) {
            return res
                .status(400)
                .json({ message: 'Invalid date range: to must be after from' });
        }
        const events = yield EventModel_1.EventModel.find({
            userId,
            start: { $lt: toDate },
            end: { $gt: fromDate },
        });
        res.status(200).json(events);
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getEvents = getEvents;
// Utility function to validate and convert date to ISO format in UTC
const validateAndConvertToISO = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
    }
    return date.toISOString(); // Ensure UTC
};
const createEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const validation = eventSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(422).json({
                message: 'Validation failed',
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                })),
            });
        }
        const { title, start, end, allDay, location, notes } = validation.data;
        const startTime = validateAndConvertToISO(start); // Ensure UTC
        const endTime = validateAndConvertToISO(end); // Ensure UTC
        if (new Date(endTime) <= new Date(startTime)) {
            return res
                .status(400)
                .json({ message: 'End time must be after start time' });
        }
        const newEvent = new EventModel_1.EventModel({
            userId,
            title,
            start: startTime,
            end: endTime,
            allDay: allDay || false,
            location,
            notes,
            source: 'manual',
        });
        yield newEvent.save();
        res.status(201).json(newEvent);
    }
    catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.createEvent = createEvent;
const updateEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Event not found' });
        }
        const updates = req.body;
        if (updates.start) {
            updates.start = validateAndConvertToISO(updates.start); // Ensure UTC
        }
        if (updates.end) {
            updates.end = validateAndConvertToISO(updates.end); // Ensure UTC
        }
        if (updates.start &&
            updates.end &&
            new Date(updates.end) <= new Date(updates.start)) {
            return res
                .status(400)
                .json({ message: 'End time must be after start time' });
        }
        const updatedEvent = yield EventModel_1.EventModel.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true });
        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(updatedEvent);
    }
    catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateEvent = updateEvent;
const deleteEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Event not found' });
        }
        const deletedEvent = yield EventModel_1.EventModel.findOneAndDelete({ _id: id, userId });
        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.deleteEvent = deleteEvent;
const importICS = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Placeholder for ICS import logic
        res.status(200).json({ message: 'ICS import not implemented yet' });
    }
    catch (error) {
        console.error('Error importing ICS:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.importICS = importICS;
function dayBoundsUTC(localDate) {
    const VN_TZ_OFFSET = '+07:00';
    const startUTC = new Date(`${localDate}T00:00:00${VN_TZ_OFFSET}`);
    const endUTC = new Date(`${localDate}T24:00:00${VN_TZ_OFFSET}`);
    return { startUTC, endUTC };
}
const getTodayEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const today = new Date().toISOString().split('T')[0];
        const { startUTC, endUTC } = dayBoundsUTC(today);
        const events = yield EventModel_1.EventModel.find({
            userId,
            start: { $gte: startUTC, $lt: endUTC },
        });
        res.json(events);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching today\'s events', error });
    }
});
exports.getTodayEvents = getTodayEvents;
