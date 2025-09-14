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
exports.getWeeklyAnalytics = exports.updateWeeklyAnalytics = exports.getWeeklyTrends = exports.getDaySummary = void 0;
const TaskModel_1 = require("../models/TaskModel");
const EventModel_1 = require("../models/EventModel");
const AnalyticsModel_1 = require("../models/AnalyticsModel");
const TaskController_1 = require("./TaskController");
const getDaySummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { date } = req.query;
        console.log('Debugging getDaySummary:');
        console.log('userId:', userId);
        console.log('date:', date);
        if (!date || typeof date !== 'string') {
            console.log('Invalid date parameter');
            return res.status(400).json({ message: 'Invalid date parameter' });
        }
        const { startUTC, endUTC } = (0, TaskController_1.dayBoundsUTC)(date);
        console.log('startUTC:', startUTC);
        console.log('endUTC:', endUTC);
        // Use range query to match tasks within the day
        const tasks = yield TaskModel_1.TaskModel.find({
            userId,
            date: { $gte: startUTC, $lt: endUTC },
        });
        const events = yield EventModel_1.EventModel.find({
            userId,
            start: { $lt: endUTC },
            end: { $gt: startUTC },
        });
        console.log('Fetched tasks:', tasks);
        console.log('Fetched events:', events);
        const taskMinutes = tasks.reduce((sum, t) => sum + (t.durationMin || 0), 0);
        const eventMinutes = events.reduce((sum, ev) => {
            const c = (0, TaskController_1.clampToDay)(ev.start, ev.end, startUTC, endUTC);
            return sum + (c ? (0, TaskController_1.minutesBetween)(c.start, c.end) : 0);
        }, 0);
        console.log('taskMinutes:', taskMinutes);
        console.log('eventMinutes:', eventMinutes);
        const userPreferences = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.preferences) || { dailyBudgetMin: 720 };
        const budgetMin = userPreferences.dailyBudgetMin;
        const spentMin = taskMinutes + eventMinutes;
        const remainingMin = budgetMin - spentMin;
        console.log('spentMin:', spentMin);
        console.log('remainingMin:', remainingMin);
        const doneTasks = tasks.filter((task) => task.done);
        const totalTasks = tasks.length;
        console.log('doneTasks:', doneTasks);
        console.log('totalTasks:', totalTasks);
        const taskProgress = {
            simple: totalTasks > 0 ? doneTasks.length / totalTasks : 0,
            timeWeighted: totalTasks > 0
                ? doneTasks.reduce((sum, task) => sum + (task.durationMin || 0), 0) /
                    taskMinutes
                : 0,
        };
        console.log('taskProgress:', taskProgress);
        const breakdownByCategory = tasks.reduce((acc, task) => {
            var _a;
            const categoryId = ((_a = task.categoryId) === null || _a === void 0 ? void 0 : _a.toString()) || 'uncategorized';
            const categoryName = task.categoryName || 'Uncategorized';
            const category = acc.find((c) => c.categoryId === categoryId);
            if (category) {
                category.minutes += task.durationMin || 0;
            }
            else {
                acc.push({
                    categoryId,
                    name: categoryName,
                    minutes: task.durationMin || 0,
                });
            }
            return acc;
        }, []);
        console.log('breakdownByCategory:', breakdownByCategory);
        res.status(200).json({
            budgetMin,
            spentMin,
            remainingMin,
            taskProgress,
            breakdownByCategory,
        });
    }
    catch (error) {
        console.error('Error fetching day summary:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getDaySummary = getDaySummary;
const getWeeklyTrends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { start } = req.query;
        if (!start || typeof start !== 'string') {
            return res.status(400).json({ message: 'Invalid start parameter' });
        }
        const startDate = new Date(start);
        if (isNaN(startDate.getTime())) {
            return res.status(400).json({ message: 'Invalid start date' });
        }
        // Adjust to the nearest Monday
        const dayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const diffToMonday = (dayOfWeek + 6) % 7; // Days to subtract to get to Monday
        startDate.setDate(startDate.getDate() - diffToMonday);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(400).json({ message: 'User is not authenticated' });
        }
        const daily = [];
        const byCategory = [];
        let streak = 0;
        let currentStreak = 0;
        let totalSpentMinutes = 0;
        let daysWithData = 0;
        const threshold = 60; // Minimum productive minutes to count for streak
        for (let i = 0; i < 7; i++) {
            const dayStart = new Date(startDate);
            dayStart.setDate(dayStart.getDate() + i);
            const dayStartString = dayStart.toISOString().split('T')[0]; // Extract only the date part
            const { startUTC, endUTC } = (0, TaskController_1.dayBoundsUTC)(dayStartString);
            const tasks = yield TaskModel_1.TaskModel.find({
                userId,
                date: { $gte: startUTC, $lt: endUTC },
            });
            const events = yield EventModel_1.EventModel.find({
                userId,
                start: { $lt: endUTC },
                end: { $gt: startUTC },
            });
            console.log(`Day ${i} (${dayStartString}): Found ${tasks.length} tasks, ${events.length} events`);
            // Calculate task and event minutes
            const taskMinutes = tasks.reduce((sum, t) => sum + (t.durationMin || 0), 0);
            const eventMinutes = events.reduce((sum, ev) => {
                const c = (0, TaskController_1.clampToDay)(ev.start, ev.end, startUTC, endUTC);
                return sum + (c ? (0, TaskController_1.minutesBetween)(c.start, c.end) : 0);
            }, 0);
            const totalMinutes = taskMinutes + eventMinutes;
            totalSpentMinutes += totalMinutes;
            daily.push({ date: dayStartString, minutes: totalMinutes });
            // Count days with data for average calculation
            if (totalMinutes > 0) {
                daysWithData++;
            }
            // Aggregate by category for tasks and events
            tasks.forEach((task) => {
                var _a;
                const categoryId = ((_a = task.categoryId) === null || _a === void 0 ? void 0 : _a.toString()) || 'uncategorized';
                const categoryName = task.categoryName || 'Uncategorized';
                console.log('Task categoryId:', categoryId, 'categoryName:', categoryName, 'durationMin:', task.durationMin);
                const category = byCategory.find((c) => c.categoryId === categoryId);
                if (category) {
                    category.minutes += task.durationMin || 0;
                }
                else {
                    byCategory.push({
                        categoryId,
                        name: categoryName,
                        minutes: task.durationMin || 0,
                    });
                }
            });
            events.forEach((event) => {
                // Event minutes are already included in totalMinutes calculation above
                // No need to add separately to byCategory since events don't have categories
            });
            const productiveMinutes = totalMinutes; // All time spent is considered productive
            if (productiveMinutes >= threshold) {
                currentStreak++;
            }
            else {
                streak = Math.max(streak, currentStreak);
                currentStreak = 0;
            }
        }
        streak = Math.max(streak, currentStreak);
        const focusRatio = daysWithData > 0 ? totalSpentMinutes / daysWithData / 60 : 0; // Average productive hours per day
        // Calculate average time spent per category
        const averageByCategory = byCategory.map((category) => ({
            categoryId: category.categoryId,
            name: category.name,
            minutes: category.minutes / 7, // Divide by 7 days in the week
        }));
        // Debug logs
        console.log('Weekly Trends Debug:');
        console.log('Daily:', daily);
        console.log('By Category (Average):', averageByCategory);
        console.log('Focus Ratio:', focusRatio);
        console.log('Streak:', streak);
        res.status(200).json({ byCategory: averageByCategory, daily, focusRatio, streak });
    }
    catch (error) {
        console.error('Error fetching weekly trends:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getWeeklyTrends = getWeeklyTrends;
const updateWeeklyAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(400).json({ message: 'User is not authenticated' });
        }
        const { date } = req.query;
        // Use provided date or default to today
        const today = date && typeof date === 'string' ? new Date(date) : new Date();
        console.log('Testing with date:', today);
        const todayString = today.toISOString().split('T')[0];
        // Call getDaySummary internally to get today's data
        const mockReq = {
            query: { date: todayString },
            user: req.user
        };
        let daySummaryData = null;
        const mockDayRes = {
            status: (code) => ({
                json: (data) => {
                    if (code === 200) {
                        daySummaryData = data;
                    }
                }
            })
        };
        yield (0, exports.getDaySummary)(mockReq, mockDayRes);
        // Calculate week start for weekly trends
        const dayOfWeek = today.getDay();
        const diffToMonday = (dayOfWeek + 6) % 7;
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - diffToMonday);
        const weekStartString = weekStart.toISOString().split('T')[0];
        // Call getWeeklyTrends internally to get weekly data
        const mockWeekReq = {
            query: { start: weekStartString },
            user: req.user
        };
        let weeklyTrendsData = null;
        const mockWeekRes = {
            status: (code) => ({
                json: (data) => {
                    if (code === 200) {
                        weeklyTrendsData = data;
                    }
                }
            })
        };
        yield (0, exports.getWeeklyTrends)(mockWeekReq, mockWeekRes);
        // Fetch or create the weekly analytics document
        let analytics = yield AnalyticsModel_1.AnalyticsModel.findOne({ userId, weekStart: weekStartString });
        if (!analytics) {
            analytics = new AnalyticsModel_1.AnalyticsModel({
                userId,
                weekStart: weekStartString,
                daily: [],
                totalMinutes: 0,
                byCategory: [],
                focusRatio: { activeMin: 0, restMin: 0 },
                streak: 0,
            });
        }
        // Update analytics with the data from the functions
        if (daySummaryData && weeklyTrendsData) {
            const { startUTC, endUTC } = (0, TaskController_1.dayBoundsUTC)(todayString);
            // Get tasks for category aggregation
            const tasks = yield TaskModel_1.TaskModel.find({ userId, date: { $gte: startUTC, $lt: endUTC } });
            // Update daily analytics for today
            const existingDay = analytics.daily.find((d) => d.date === todayString);
            if (existingDay) {
                existingDay.spentMin = daySummaryData.spentMin;
                existingDay.taskMinutes = daySummaryData.spentMin; // Assuming all spent time is from tasks for now
                existingDay.eventMinutes = 0;
                existingDay.productiveMinutes = daySummaryData.spentMin;
            }
            else {
                analytics.daily.push({
                    date: todayString,
                    spentMin: daySummaryData.spentMin,
                    taskMinutes: daySummaryData.spentMin,
                    eventMinutes: 0,
                    productiveMinutes: daySummaryData.spentMin,
                    byCategory: tasks.reduce((acc, task) => {
                        var _a;
                        const categoryId = ((_a = task.categoryId) === null || _a === void 0 ? void 0 : _a.toString()) || 'uncategorized';
                        const categoryName = task.categoryName || 'Uncategorized';
                        const category = acc.find((c) => c.categoryId === categoryId);
                        if (category) {
                            category.minutes += task.durationMin || 0;
                        }
                        else {
                            acc.push({ categoryId, name: categoryName, minutes: task.durationMin || 0 });
                        }
                        return acc;
                    }, []),
                });
            }
            // Update weekly totals using data from getWeeklyTrends
            analytics.totalMinutes = weeklyTrendsData.daily.reduce((sum, day) => sum + day.minutes, 0);
            analytics.byCategory = weeklyTrendsData.byCategory.map((cat) => ({
                categoryId: cat.categoryId,
                name: cat.name,
                minutes: cat.minutes * 7, // Convert back from average to total
            }));
            // Update focus ratio (now average productive hours per day)
            analytics.focusRatio = {
                activeMin: weeklyTrendsData.focusRatio * 60, // Convert hours back to minutes
                restMin: 0,
            };
            analytics.streak = weeklyTrendsData.streak;
        }
        yield analytics.save();
        res.status(200).json({
            message: 'Weekly analytics updated successfully',
            analytics: {
                totalMinutes: analytics.totalMinutes,
                byCategory: analytics.byCategory,
                focusRatio: analytics.focusRatio,
                streak: analytics.streak,
            }
        });
    }
    catch (error) {
        console.error('Error updating weekly analytics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateWeeklyAnalytics = updateWeeklyAnalytics;
const getWeeklyAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(400).json({ message: 'User is not authenticated' });
        }
        const { date } = req.query;
        // Use provided date or default to today
        let targetDate;
        if (date && typeof date === 'string') {
            targetDate = new Date(date);
            if (isNaN(targetDate.getTime())) {
                return res.status(400).json({ message: 'Invalid date parameter' });
            }
        }
        else {
            targetDate = new Date();
        }
        // Calculate week start (Monday) for the target date
        const dayOfWeek = targetDate.getDay();
        const diffToMonday = (dayOfWeek + 6) % 7;
        const weekStart = new Date(targetDate);
        weekStart.setDate(targetDate.getDate() - diffToMonday);
        const weekStartString = weekStart.toISOString().split('T')[0];
        console.log('Getting weekly analytics for week starting:', weekStartString);
        // Find existing analytics document
        let analytics = yield AnalyticsModel_1.AnalyticsModel.findOne({ userId, weekStart: weekStartString });
        if (!analytics) {
            console.log('No analytics found, creating default analytics');
            // If no analytics exist, return default structure or create one
            return res.status(200).json({
                weekStart: weekStartString,
                totalMinutes: 0,
                daily: [],
                byCategory: [],
                focusRatio: { activeMin: 0, restMin: 0 },
                streak: 0,
                averageProductiveHours: 0,
                totalRestMinutes: 0,
            });
        }
        // Calculate additional metrics for frontend
        const totalSpentMinutes = analytics.totalMinutes || 0;
        const averageProductiveHours = totalSpentMinutes / 60 / 7; // Average hours per day over 7 days
        const totalRestMinutes = (7 * 24 * 60) - totalSpentMinutes; // Total rest minutes for the week
        console.log('Returning analytics:', {
            totalMinutes: analytics.totalMinutes,
            byCategory: ((_b = analytics.byCategory) === null || _b === void 0 ? void 0 : _b.length) || 0,
            averageProductiveHours,
            streak: analytics.streak,
        });
        res.status(200).json({
            weekStart: weekStartString,
            totalMinutes: analytics.totalMinutes,
            daily: analytics.daily || [],
            byCategory: analytics.byCategory || [],
            focusRatio: analytics.focusRatio || { activeMin: 0, restMin: 0 },
            streak: analytics.streak || 0,
            averageProductiveHours,
            totalRestMinutes,
        });
    }
    catch (error) {
        console.error('Error fetching weekly analytics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getWeeklyAnalytics = getWeeklyAnalytics;
