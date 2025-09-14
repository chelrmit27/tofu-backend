"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryModel = void 0;
const mongoose_1 = require("mongoose");
const categorySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    color: { type: String, required: true },
    isSystem: { type: Boolean, default: false },
    position: { type: Number, required: true },
}, {
    timestamps: true,
});
exports.CategoryModel = (0, mongoose_1.model)('Category', categorySchema);
