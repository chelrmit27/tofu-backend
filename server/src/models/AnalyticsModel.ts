import { Schema, model } from 'mongoose';

const DailyAnalyticsSchema = new Schema({
  date: { type: String, required: true }, // '2025-09-11'
  spentMin: { type: Number, required: true },
  taskMinutes: { type: Number, required: true },
  eventMinutes: { type: Number, required: true },
  productiveMinutes: { type: Number, required: true },
  byCategory: [
    {
      categoryId: String,
      name: String,
      minutes: Number,
    },
  ],
});

const AnalyticsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  weekStart: { type: String, required: true }, // e.g., '2025-09-09' (Monday)
  daily: [DailyAnalyticsSchema],
  totalMinutes: Number,
  byCategory: [
    {
      categoryId: String,
      name: String,
      minutes: Number,
    },
  ],
  focusRatio: {
    activeMin: Number,
    restMin: Number,
  },
  streak: Number,
});

export const AnalyticsModel = model('Analytics', AnalyticsSchema);
