import { Response } from 'express';
import { CategoryModel, ICategory } from '../models/CategoryModel';
import { Types } from 'mongoose';
import { z } from 'zod';

import { AuthenticatedRequest } from '../middleware/authMiddleware';

const categorySchema = z.object({
  name: z.string().min(1).max(40),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const getCategories = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;
    const categories: ICategory[] = await CategoryModel.find({ userId }).sort({
      position: 1,
      name: 1,
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCategory = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;
    const validation = categorySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(422).json({
        message: 'Validation failed',
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { name, color } = validation.data;

    const existingCategory = await CategoryModel.findOne({ userId, name });
    if (existingCategory) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    const maxPosition = await CategoryModel.find({ userId })
      .sort({ position: -1 })
      .limit(1);
    const position = maxPosition.length > 0 ? maxPosition[0].position + 1 : 0;

    const newCategory = new CategoryModel({ userId, name, color, position });
    await newCategory.save();

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCategory = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const updates = req.body;
    const updatedCategory = await CategoryModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { new: true },
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCategory = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const deletedCategory = await CategoryModel.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
