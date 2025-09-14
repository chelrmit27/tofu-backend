"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = exports.parseDate = void 0;
const parseDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
    }
    return date;
};
exports.parseDate = parseDate;
const formatDate = (date) => {
    return date.toISOString();
};
exports.formatDate = formatDate;
