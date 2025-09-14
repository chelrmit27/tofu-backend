import { Schema, model, Document } from 'mongoose';

export interface IReminder extends Document {
  userId: Schema.Types.ObjectId;
  title: string;
  description: string;
  dueAt?: Date;
  notes: string;
}

const reminderSchema = new Schema<IReminder>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String, required: false },
    dueAt: { type: Date, required: false },
    notes: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

export const ReminderModel = model<IReminder>('Reminder', reminderSchema);
