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
exports.getTodayTasks = exports.deleteTask = exports.updateTask = exports.createTask = exports.getTasks = void 0;
exports.dayBoundsUTC = dayBoundsUTC;
exports.localDateTimeToUTC = localDateTimeToUTC;
exports.minutesBetween = minutesBetween;
exports.clampToDay = clampToDay;
const TaskModel_1 = require("../models/TaskModel");
const EventModel_1 = require("../models/EventModel");
const CategoryModel_1 = require("../models/CategoryModel"); // Import CategoryModel
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
const taskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(240),
    categoryId: zod_1.z.string(),
    date: zod_1.z.string(),
    startHHMM: zod_1.z.string(),
    endHHMM: zod_1.z.string(),
    notes: zod_1.z.string().optional(),
});
// Constants
const VN_TZ_OFFSET = '+07:00'; // Vietnam has no DST
// Utility Functions
function dayBoundsUTC(localDate) {
    if (isNaN(new Date(`${localDate}T00:00:00${VN_TZ_OFFSET}`).getTime())) {
        throw new Error(`Invalid date format passed to dayBoundsUTC: ${localDate}`);
    }
    const startUTC = new Date(`${localDate}T00:00:00${VN_TZ_OFFSET}`);
    const endUTC = new Date(`${localDate}T24:00:00${VN_TZ_OFFSET}`);
    return { startUTC, endUTC }; // [start, end)
}
function localDateTimeToUTC(localDate, hhmm) {
    return new Date(`${localDate}T${hhmm}:00${VN_TZ_OFFSET}`);
}
function minutesBetween(start, end) {
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
}
function clampToDay(start, end, dayStart, dayEnd) {
    const s = start < dayStart ? dayStart : start;
    const e = end > dayEnd ? dayEnd : end;
    return e > s ? { start: s, end: e } : null;
}
// Updated TaskController
const getTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { date, done } = req.query;
        console.log('getTasks called with date:', date, 'and done:', done);
        console.log('User ID:', userId);
        if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                message: 'Invalid date parameter. Expected format: YYYY-MM-DD',
            });
        }
        const { startUTC, endUTC } = dayBoundsUTC(date);
        const tasksQuery = {
            userId,
            $or: [
                { date: { $gte: startUTC, $lt: endUTC } },
                { start: { $lt: endUTC }, end: { $gt: startUTC } },
            ],
        };
        if (done !== undefined) {
            tasksQuery.done = done === 'true';
        }
        console.log('Tasks Query:', tasksQuery); // Log the query being sent to the database
        const tasks = yield TaskModel_1.TaskModel.find(tasksQuery).sort({ start: 1 });
        console.log('Tasks fetched from database:', tasks); // Log the tasks fetched from the database
        const events = yield EventModel_1.EventModel.find({
            userId,
            start: { $lt: endUTC },
            end: { $gt: startUTC },
        });
        console.log('Events fetched from database:', events); // Log the events fetched from the database
        const merged = [
            ...tasks,
            ...events.map((e) => ({
                _id: e._id,
                title: e.title,
                start: e.start,
                end: e.end,
                isEvent: true,
                done: null,
                location: e.location,
                notes: e.notes,
            })),
        ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        console.log('Merged tasks and events:', merged); // Log the merged tasks and events
        res.status(200).json({ tasks, events, merged });
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getTasks = getTasks;
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const validation = taskSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(422).json({
                message: 'Validation failed',
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                })),
            });
        }
        const { title, categoryId, date, startHHMM, endHHMM, notes } = validation.data;
        if (!mongoose_1.Types.ObjectId.isValid(categoryId)) {
            return res.status(404).json({ message: 'Invalid category ID' });
        }
        const start = localDateTimeToUTC(date, startHHMM);
        const end = localDateTimeToUTC(date, endHHMM);
        if (end <= start) {
            return res
                .status(400)
                .json({ message: 'End time must be after start time' });
        }
        const durationMin = minutesBetween(start, end);
        // Fetch categoryName if not provided
        const category = yield CategoryModel_1.CategoryModel.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        const newTask = new TaskModel_1.TaskModel({
            userId,
            title,
            categoryId,
            categoryName: category.name, // Populate categoryName
            date, // Store the local date string
            start,
            end,
            durationMin,
            done: false,
            notes,
            isEvent: req.body.isEvent || false, // Default to false if not provided
            isReminder: req.body.isReminder || false, // Default to false if not provided
        });
        yield newTask.save();
        res.status(201).json(newTask);
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.createTask = createTask;
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { id } = req.params;
        console.log('Update Task Request Params:', req.params);
        console.log('Update Task Request Body:', req.body);
        console.log('Authenticated User ID:', userId);
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const updates = Object.assign({}, req.body);
        if (!Object.prototype.hasOwnProperty.call(req.body, 'done')) {
            delete updates.done;
        }
        if (updates.start && updates.end) {
            const startTime = new Date(updates.start);
            const endTime = new Date(updates.end);
            if (endTime <= startTime) {
                return res
                    .status(400)
                    .json({ message: 'End time must be after start time' });
            }
            updates.durationMin = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));
        }
        if (updates.start) {
            const startDate = new Date(updates.start);
            updates.start = new Date(startDate.toISOString()); // Ensure start is in UTC as a Date object
            updates.date = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
        }
        if (updates.end) {
            const endDate = new Date(updates.end);
            updates.end = new Date(endDate.toISOString()); // Ensure end is in UTC as a Date object
        }
        const updatedTask = yield TaskModel_1.TaskModel.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true });
        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json(updatedTask);
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateTask = updateTask;
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const deletedTask = yield TaskModel_1.TaskModel.findOneAndDelete({ _id: id, userId });
        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.deleteTask = deleteTask;
const getTodayTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const today = new Date().toISOString().split('T')[0];
        const { startUTC, endUTC } = dayBoundsUTC(today);
        const tasks = yield TaskModel_1.TaskModel.find({
            userId,
            date: { $gte: startUTC, $lt: endUTC },
        });
        const spentMinutes = tasks.reduce((total, task) => {
            if (task.start && task.end) {
                return total + minutesBetween(task.start, task.end);
            }
            return total;
        }, 0);
        const spentHours = Math.round(spentMinutes / 60);
        res.json({ spentHours });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching today\'s tasks', error });
    }
});
exports.getTodayTasks = getTodayTasks;
