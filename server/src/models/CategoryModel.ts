import { Schema, model, Document } from 'mongoose';

export interface ICategory extends Document {
  userId: Schema.Types.ObjectId;
  name: string;
  color: string;
  isSystem: boolean;
  position: number;
}

const categorySchema = new Schema<ICategory>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    color: { type: String, required: true },
    isSystem: { type: Boolean, default: false },
    position: { type: Number, required: true },
  },
  {
    timestamps: true,
  },
);

export const CategoryModel = model<ICategory>('Category', categorySchema);
