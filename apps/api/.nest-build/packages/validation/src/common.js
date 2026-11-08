"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRecord = isRecord;
exports.requiredString = requiredString;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function requiredString(value, path, maxLength = 1000) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        return { success: false, issues: [{ path, message: 'A non-empty string is required.' }] };
    }
    if (value.length > maxLength) {
        return { success: false, issues: [{ path, message: `Must be at most ${maxLength} characters.` }] };
    }
    return { success: true, data: value.trim() };
}
