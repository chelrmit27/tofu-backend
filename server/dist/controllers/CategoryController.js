"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
const CategoryModel_1 = require("../models/CategoryModel");
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
const categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(40),
    color: zod_1.z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
});
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const categories = yield CategoryModel_1.CategoryModel.find({ userId }).sort({
            position: 1,
            name: 1,
        });
        res.status(200).json(categories);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.getCategories = getCategories;
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
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
        const existingCategory = yield CategoryModel_1.CategoryModel.findOne({ userId, name });
        if (existingCategory) {
            return res.status(409).json({ message: 'Category already exists' });
        }
        const maxPosition = yield CategoryModel_1.CategoryModel.find({ userId })
            .sort({ position: -1 })
            .limit(1);
        const position = maxPosition.length > 0 ? maxPosition[0].position + 1 : 0;
        const newCategory = new CategoryModel_1.CategoryModel({ userId, name, color, position });
        yield newCategory.save();
        res.status(201).json(newCategory);
    }
    catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.createCategory = createCategory;
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Category not found' });
        }
        const updates = req.body;
        const updatedCategory = yield CategoryModel_1.CategoryModel.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true });
        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(updatedCategory);
    }
    catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.updateCategory = updateCategory;
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Category not found' });
        }
        const deletedCategory = yield CategoryModel_1.CategoryModel.findOneAndDelete({
            _id: id,
            userId,
        });
        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.deleteCategory = deleteCategory;
