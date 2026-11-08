"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEventInput = validateEventInput;
const common_ts_1 = require("./common.js");
const eventStatuses = [
    'draft',
    'published',
    'scheduled',
    'archived',
];
function validateEventInput(value) {
    if (!(0, common_ts_1.isRecord)(value)) {
        return { success: false, issues: [{ path: '', message: 'Expected an object.' }] };
    }
    const title = boundedString(value.title, 'title', 180, true);
    const subtitle = boundedString(value.subtitle, 'subtitle', 300);
    const description = boundedString(value.description, 'description', 2000);
    const longDescription = boundedString(value.longDescription, 'longDescription', 20000);
    const date = boundedString(value.date, 'date', 10, true);
    const endDate = optionalDate(value.endDate, 'endDate');
    const time = boundedString(value.time, 'time', 120);
    const venue = boundedString(value.venue, 'venue', 300, true);
    const city = boundedString(value.city, 'city', 160);
    const category = boundedString(value.category, 'category', 120, true);
    const poster = boundedString(value.poster, 'poster', 2000);
    const banner = boundedString(value.banner, 'banner', 2000);
    const organizer = boundedString(value.organizer, 'organizer', 180);
    const organizerRole = boundedString(value.organizerRole, 'organizerRole', 180);
    const organizerPhoto = boundedString(value.organizerPhoto, 'organizerPhoto', 2000);
    const capacity = typeof value.capacity === 'number' &&
        Number.isInteger(value.capacity) &&
        value.capacity > 0 &&
        value.capacity <= 1000000
        ? value.capacity
        : null;
    const status = typeof value.status === 'string' && eventStatuses.includes(value.status)
        ? value.status
        : null;
    const featured = typeof value.featured === 'boolean' ? value.featured : null;
    const gallery = stringArray(value.gallery, 'gallery', 40, 2000);
    const tags = stringArray(value.tags, 'tags', 40, 80);
    const schedule = scheduleArray(value.schedule);
    if (!title.success || !subtitle.success || !description.success ||
        !longDescription.success || !date.success || !endDate.success ||
        !time.success || !venue.success || !city.success || !category.success ||
        !poster.success || !banner.success || !organizer.success ||
        !organizerRole.success || !organizerPhoto.success || capacity === null ||
        status === null || featured === null || !gallery.success ||
        !tags.success || !schedule.success || !isDate(date.data) ||
        (endDate.data && (!isDate(endDate.data) || endDate.data < date.data))) {
        return { success: false, issues: [{ path: '', message: 'Event fields are invalid.' }] };
    }
    return {
        success: true,
        data: {
            title: title.data,
            subtitle: subtitle.data,
            description: description.data,
            longDescription: longDescription.data,
            date: date.data,
            ...(endDate.data ? { endDate: endDate.data } : {}),
            time: time.data,
            venue: venue.data,
            city: city.data,
            category: category.data,
            poster: poster.data,
            banner: banner.data,
            gallery: gallery.data,
            schedule: schedule.data,
            organizer: organizer.data,
            organizerRole: organizerRole.data,
            organizerPhoto: organizerPhoto.data,
            capacity,
            tags: tags.data,
            status,
            featured,
        },
    };
}
function boundedString(value, path, maxLength, required = false) {
    if (value === undefined && !required) {
        return { success: true, data: '' };
    }
    if (typeof value !== 'string' || value.length > maxLength || (required && !value.trim())) {
        return { success: false, issues: [{ path, message: 'Invalid string value.' }] };
    }
    return { success: true, data: value.trim() };
}
function optionalDate(value, path) {
    if (value === undefined || value === null || value === '') {
        return { success: true, data: '' };
    }
    return boundedString(value, path, 10, true);
}
function stringArray(value, path, maxItems, maxLength) {
    if (value === undefined ||
        (Array.isArray(value) &&
            value.length <= maxItems &&
            value.every((item) => typeof item === 'string' && item.trim().length <= maxLength))) {
        return {
            success: true,
            data: Array.isArray(value) ? value.map((item) => item.trim()).filter(Boolean) : [],
        };
    }
    return { success: false, issues: [{ path, message: 'Invalid string list.' }] };
}
function scheduleArray(value) {
    if (value === undefined) {
        return { success: true, data: [] };
    }
    if (Array.isArray(value) &&
        value.length <= 100 &&
        value.every((item) => (0, common_ts_1.isRecord)(item) &&
            typeof item.time === 'string' &&
            item.time.length <= 80 &&
            typeof item.title === 'string' &&
            item.title.length > 0 &&
            item.title.length <= 180 &&
            typeof item.detail === 'string' &&
            item.detail.length <= 1000)) {
        return {
            success: true,
            data: value.map((item) => ({
                time: item.time.trim(),
                title: item.title.trim(),
                detail: item.detail.trim(),
            })),
        };
    }
    return { success: false, issues: [{ path: 'schedule', message: 'Invalid schedule.' }] };
}
function isDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}
