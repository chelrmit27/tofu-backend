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
exports.convertToTask = exports.deleteReminder = exports.updateReminder = exports.createReminder = exports.getReminders = void 0;
const ReminderModel_1 = require("../models/ReminderModel");
const TaskModel_1 = require("../models/TaskModel");
const validationHelper_1 = require("../middleware/validationHelper");
const DateHelper_1 = require("../utils/DateHelper");
const getReminders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Added validation to ensure req.user is populated before accessing userId.
        if (!req.user) {
            return res.status(400).json({ error: 'User is not authenticated' });
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        console.log('Authenticated userId:', userId);
        const reminders = yield ReminderModel_1.ReminderModel.find({ userId });
        res.status(200).json(reminders);
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: `Failed to fetch reminders ${err.message}` });
    }
});
exports.getReminders = getReminders;
const createReminder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Added validation to ensure req.user is populated before accessing userId.
        if (!req.user) {
            return res.status(400).json({ error: 'User is not authenticated' });
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { title, description, date, time } = req.body;
        (0, validationHelper_1.validateReminderInput)(req.body);
        // Combine date and time into a single ISO 8601 string
        const dueDateTime = `${date}T${time}:00`;
        const parsedDueDate = new Date(dueDateTime);
        if (isNaN(parsedDueDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date or time format' });
        }
        const newReminder = new ReminderModel_1.ReminderModel({
            title,
            description,
            dueAt: parsedDueDate,
            userId, // Correctly set the userId field
        });
        yield newReminder.save();
        res.status(201).json(newReminder);
    }
    catch (error) {
        const err = error;
        res
            .status(400)
            .json({ error: `Error creating new reminder: ${err.message}` });
    }
});
exports.createReminder = createReminder;
const updateReminder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Added validation to ensure req.user is populated before accessing userId.
        if (!req.user) {
            return res.status(400).json({ error: 'User is not authenticated' });
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { id } = req.params;
        const { title, description, dueDate } = req.body;
        console.log('New description:', description);
        // Added null checks for reminder and ensured proper type handling for properties.
        const reminder = yield ReminderModel_1.ReminderModel.findById(id);
        if (!reminder) {
            return res.status(404).json({ error: 'Reminder not found' });
        }
        // Explicitly cast reminder.userId to a string after null checks.
        const owner = (_b = reminder.userId) === null || _b === void 0 ? void 0 : _b.toString();
        if (!owner) {
            return res.status(400).json({ error: 'Reminder owner is undefined' });
        }
        (0, validationHelper_1.validateOwnership)({ owner }, userId);
        if (title)
            reminder.title = title;
        if (description)
            reminder.set('description', description);
        if (dueDate)
            reminder.set('dueAt', (0, DateHelper_1.parseDate)(dueDate));
        console.log('Updated:', reminder.description);
        yield reminder.save();
        res.status(200).json(reminder);
    }
    catch (error) {
        const err = error;
        res.status(400).json({ error: err.message });
    }
});
exports.updateReminder = updateReminder;
const deleteReminder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Added validation to ensure req.user is populated before accessing userId.
        if (!req.user) {
            return res.status(400).json({ error: 'User is not authenticated' });
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { id } = req.params;
        const reminder = yield ReminderModel_1.ReminderModel.findById(id);
        if (reminder) {
            (0, validationHelper_1.validateOwnership)({ owner: reminder.userId.toString() }, userId);
            yield reminder.deleteOne();
            res.status(200).json({ message: 'Reminder deleted successfully' });
        }
        else {
            res.status(404).json({ error: 'Reminder not found' });
        }
    }
    catch (error) {
        const err = error;
        res.status(400).json({ error: err.message });
    }
});
exports.deleteReminder = deleteReminder;
const convertToTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Added validation to ensure req.user is populated before accessing userId.
        if (!req.user) {
            return res.status(400).json({ error: 'User is not authenticated' });
        }
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { id } = req.params;
        const reminder = yield ReminderModel_1.ReminderModel.findById(id);
        // Refined the null check to ensure TypeScript recognizes reminder is not null.
        if (!reminder) {
            return res.status(404).json({ error: 'Reminder not found' });
        }
        // Renamed the extracted userId variable and ensured it is non-nullable.
        const { userId: reminderOwnerId } = reminder;
        if (!reminderOwnerId) {
            return res.status(400).json({ error: 'Reminder owner is undefined' });
        }
        // Added a check to ensure req.user?.userId is defined before proceeding.
        if (!userId) {
            return res.status(400).json({ error: 'User ID is undefined' });
        }
        (0, validationHelper_1.validateOwnership)({ owner: reminderOwnerId.toString() }, userId);
        const newTask = new TaskModel_1.TaskModel({
            title: reminder.title,
            notes: reminder.get('description'),
            date: reminder.get('dueAt'), // Use dueAt as the date
            start: reminder.get('dueAt'), // Default start time to dueAt
            end: new Date(new Date(reminder.get('dueAt')).getTime() + 3600000), // Default end time to 1 hour later
            durationMin: 60, // Default duration to 60 minutes
            categoryId: '68c0505bc6da16beddf1bd90', // Default category ID (e.g., Work)
            categoryName: 'Work', // Default category name
            userId, // Ensure userId is set
            done: false, // Default to not done
            isEvent: false, // Default to false
            isReminder: true, // Mark as converted from a reminder
        });
        yield newTask.save();
        yield reminder.deleteOne();
        res.status(201).json(newTask);
    }
    catch (error) {
        const err = error;
        res.status(400).json({ error: err.message });
    }
});
exports.convertToTask = convertToTask;
