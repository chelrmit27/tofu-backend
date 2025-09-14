import { Schema, model, Document } from 'mongoose';

export interface IEvent extends Document {
  userId: Schema.Types.ObjectId;
  title: string;
  location: string;
  start: Date;
  end: Date;
  allDay: boolean;
  notes: string;
  source: 'manual' | 'ics';
  icsUid?: string;
}

const eventSchema = new Schema<IEvent>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    location: { type: String, required: false },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    allDay: { type: Boolean, default: false },
    notes: { type: String, required: false },
    source: { type: String, enum: ['manual', 'ics'], default: 'manual' },
    icsUid: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

export const EventModel = model<IEvent>('Event', eventSchema);
