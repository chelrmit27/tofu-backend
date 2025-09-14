import { Response } from 'express';
import { EventModel } from '../models/EventModel';
import { Types } from 'mongoose';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const eventSchema = z.object({
  title: z.string().min(1).max(240),
  start: z.string(),
  end: z.string(),
  allDay: z.boolean().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const getEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
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

    const events = await EventModel.find({
      userId,
      start: { $lt: toDate },
      end: { $gt: fromDate },
    });

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Utility function to validate and convert date to ISO format in UTC
const validateAndConvertToISO = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  return date.toISOString(); // Ensure UTC
};

export const createEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
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

    const newEvent = new EventModel({
      userId,
      title,
      start: startTime,
      end: endTime,
      allDay: allDay || false,
      location,
      notes,
      source: 'manual',
    });

    await newEvent.save();

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updates = req.body;

    if (updates.start) {
      updates.start = validateAndConvertToISO(updates.start); // Ensure UTC
    }
    if (updates.end) {
      updates.end = validateAndConvertToISO(updates.end); // Ensure UTC
    }

    if (
      updates.start &&
      updates.end &&
      new Date(updates.end) <= new Date(updates.start)
    ) {
      return res
        .status(400)
        .json({ message: 'End time must be after start time' });
    }

    const updatedEvent = await EventModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true },
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const deletedEvent = await EventModel.findOneAndDelete({ _id: id, userId });

    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const importICS = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Placeholder for ICS import logic
    res.status(200).json({ message: 'ICS import not implemented yet' });
  } catch (error) {
    console.error('Error importing ICS:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

function dayBoundsUTC(localDate: string) {
  const VN_TZ_OFFSET = '+07:00';
  const startUTC = new Date(`${localDate}T00:00:00${VN_TZ_OFFSET}`);
  const endUTC = new Date(`${localDate}T24:00:00${VN_TZ_OFFSET}`);
  return { startUTC, endUTC };
}

export const getTodayEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const today = new Date().toISOString().split('T')[0];
    const { startUTC, endUTC } = dayBoundsUTC(today);

    const events = await EventModel.find({
      userId,
      start: { $gte: startUTC, $lt: endUTC },
    });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching today\'s events', error });
  }
};
