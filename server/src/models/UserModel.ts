import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  name: string;
  profilePicture: string;
  preferences: {
    timezone: string;
    dailyBudgetMin: number;
    theme: 'light' | 'dark' | 'system';
  };
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, unique: false },
    profilePicture: { type: String, required: false },
    preferences: {
      timezone: { type: String, default: 'Asia/Ho_Chi_Minh' },
      dailyBudgetMin: { type: Number, default: 720 },
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel = model<IUser>('User', userSchema);
