import { Schema, model, Document } from 'mongoose';

export interface ITask extends Document {
  userId: Schema.Types.ObjectId;
  date: Date;
  title: string;
  categoryId: Schema.Types.ObjectId;
  categoryName?: string;
  isEvent: boolean;
  isReminder: boolean;
  start: Date;
  end: Date;
  durationMin: number;
  done: boolean;
  notes: string;
  carryover?: boolean; // Added carryover field
}

const taskSchema = new Schema<ITask>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    date: { type: Date, required: true },
    title: { type: String, required: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Category',
    },
    categoryName: { type: String, required: false },
    isEvent: { type: Boolean, default: false },
    isReminder: { type: Boolean, default: false },
    start: { type: Date, required: false },
    end: { type: Date, required: false },
    durationMin: { type: Number, required: false },
    done: { type: Boolean, default: false },
    notes: { type: String, required: false },
    carryover: { type: Boolean, default: false }, // Added carryover field
  },
  {
    timestamps: true,
  },
);

export const TaskModel = model<ITask>('Task', taskSchema);
