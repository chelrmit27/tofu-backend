import { Response } from 'express';
import { ReminderModel, IReminder } from '../models/ReminderModel';
import { TaskModel } from '../models/TaskModel';
import {
  validateReminderInput,
  validateOwnership,
} from '../middleware/validationHelper';
import { parseDate } from '../utils/DateHelper';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getReminders = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    // Added validation to ensure req.user is populated before accessing userId.
    if (!req.user) {
      return res.status(400).json({ error: 'User is not authenticated' });
    }

    const userId = req.user?.userId;
    console.log('Authenticated userId:', userId);
    const reminders: IReminder[] = await ReminderModel.find({ userId });
    res.status(200).json(reminders);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ error: `Failed to fetch reminders ${err.message}` });
  }
};

export const createReminder = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    // Added validation to ensure req.user is populated before accessing userId.
    if (!req.user) {
      return res.status(400).json({ error: 'User is not authenticated' });
    }

    const userId = req.user?.userId;
    const { title, description, date, time } = req.body;

    validateReminderInput(req.body);

    // Combine date and time into a single ISO 8601 string
    const dueDateTime = `${date}T${time}:00`;
    const parsedDueDate = new Date(dueDateTime);

    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date or time format' });
    }

    const newReminder: IReminder = new ReminderModel({
      title,
      description,
      dueAt: parsedDueDate,
      userId, // Correctly set the userId field
    });

    await newReminder.save();
    res.status(201).json(newReminder);
  } catch (error) {
    const err = error as Error;
    res
      .status(400)
      .json({ error: `Error creating new reminder: ${err.message}` });
  }
};

export const updateReminder = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    // Added validation to ensure req.user is populated before accessing userId.
    if (!req.user) {
      return res.status(400).json({ error: 'User is not authenticated' });
    }

    const userId = req.user?.userId;
    const { id } = req.params;
    const { title, description, dueDate } = req.body;
    console.log('New description:', description);
    // Added null checks for reminder and ensured proper type handling for properties.
    const reminder: IReminder | null = await ReminderModel.findById(id);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    // Explicitly cast reminder.userId to a string after null checks.
    const owner = reminder.userId?.toString();
    if (!owner) {
      return res.status(400).json({ error: 'Reminder owner is undefined' });
    }
    validateOwnership({ owner }, userId);

    if (title) reminder.title = title;
    if (description) reminder.set('description', description);
    if (dueDate) reminder.set('dueAt', parseDate(dueDate));
    console.log('Updated:', reminder.description);
    await reminder.save();
    res.status(200).json(reminder);
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ error: err.message });
  }
};

export const deleteReminder = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    // Added validation to ensure req.user is populated before accessing userId.
    if (!req.user) {
      return res.status(400).json({ error: 'User is not authenticated' });
    }

    const userId = req.user?.userId;
    const { id } = req.params;

    const reminder: IReminder | null = await ReminderModel.findById(id);
    if (reminder) {
      validateOwnership({ owner: reminder.userId.toString() }, userId);
      await reminder.deleteOne();
      res.status(200).json({ message: 'Reminder deleted successfully' });
    } else {
      res.status(404).json({ error: 'Reminder not found' });
    }
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ error: err.message });
  }
};

export const convertToTask = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    // Added validation to ensure req.user is populated before accessing userId.
    if (!req.user) {
      return res.status(400).json({ error: 'User is not authenticated' });
    }

    const userId = req.user?.userId;
    const { id } = req.params;

    const reminder: IReminder | null = await ReminderModel.findById(id);
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
    validateOwnership({ owner: reminderOwnerId.toString() }, userId);

    const newTask = new TaskModel({
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

    await newTask.save();
    await reminder.deleteOne();

    res.status(201).json(newTask);
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ error: err.message });
  }
};
