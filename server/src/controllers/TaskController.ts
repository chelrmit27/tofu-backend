import { Response } from 'express';
import { TaskModel, ITask } from '../models/TaskModel';
import { EventModel } from '../models/EventModel';
import { CategoryModel } from '../models/CategoryModel'; // Import CategoryModel
import { Types } from 'mongoose';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const taskSchema = z.object({
  title: z.string().min(1).max(240),
  categoryId: z.string(),
  date: z.string(),
  startHHMM: z.string(),
  endHHMM: z.string(),
  notes: z.string().optional(),
});

// Constants
const VN_TZ_OFFSET = '+07:00'; // Vietnam has no DST

// Utility Functions
export function dayBoundsUTC(localDate: string) {
  if (isNaN(new Date(`${localDate}T00:00:00${VN_TZ_OFFSET}`).getTime())) {
    throw new Error(`Invalid date format passed to dayBoundsUTC: ${localDate}`);
  }

  const startUTC = new Date(`${localDate}T00:00:00${VN_TZ_OFFSET}`);
  const endUTC = new Date(`${localDate}T24:00:00${VN_TZ_OFFSET}`);
  return { startUTC, endUTC }; // [start, end)
}

export function localDateTimeToUTC(localDate: string, hhmm: string) {
  return new Date(`${localDate}T${hhmm}:00${VN_TZ_OFFSET}`);
}

export function minutesBetween(start: Date, end: Date) {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
}

export function clampToDay(
  start: Date,
  end: Date,
  dayStart: Date,
  dayEnd: Date,
) {
  const s = start < dayStart ? dayStart : start;
  const e = end > dayEnd ? dayEnd : end;
  return e > s ? { start: s, end: e } : null;
}

// Updated TaskController
export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { date, done } = req.query;

    console.log('getTasks called with date:', date, 'and done:', done);
    console.log('User ID:', userId);

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        message: 'Invalid date parameter. Expected format: YYYY-MM-DD',
      });
    }

    const { startUTC, endUTC } = dayBoundsUTC(date);

    const tasksQuery: any = {
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

    const tasks = await TaskModel.find(tasksQuery).sort({ start: 1 });
    console.log('Tasks fetched from database:', tasks); // Log the tasks fetched from the database

    const events = await EventModel.find({
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
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
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

    const { title, categoryId, date, startHHMM, endHHMM, notes } =
      validation.data;

    if (!Types.ObjectId.isValid(categoryId)) {
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
    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const newTask = new TaskModel({
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

    await newTask.save();

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    console.log('Update Task Request Params:', req.params);
    console.log('Update Task Request Body:', req.body);
    console.log('Authenticated User ID:', userId);

    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updates: Partial<ITask> = { ...req.body };
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

      updates.durationMin = Math.max(
        1,
        Math.round((endTime.getTime() - startTime.getTime()) / 60000),
      );
    }

    if (updates.start) {
      const startDate = new Date(updates.start);
      updates.start = new Date(startDate.toISOString()); // Ensure start is in UTC as a Date object
      updates.date = new Date(
        Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth(),
          startDate.getUTCDate(),
        ),
      );
    }

    if (updates.end) {
      const endDate = new Date(updates.end);
      updates.end = new Date(endDate.toISOString()); // Ensure end is in UTC as a Date object
    }

    const updatedTask = await TaskModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true },
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const deletedTask = await TaskModel.findOneAndDelete({ _id: id, userId });

    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTodayTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const today = new Date().toISOString().split('T')[0];
    const { startUTC, endUTC } = dayBoundsUTC(today);

    const tasks = await TaskModel.find({
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
  } catch (error) {
    res.status(500).json({ message: 'Error fetching today\'s tasks', error });
  }
};
