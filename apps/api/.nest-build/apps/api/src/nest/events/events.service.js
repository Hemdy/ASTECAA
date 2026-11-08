var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import { validateEventInput } from "../../../../../packages/validation/src/events.js";
import { events } from "../../../../../infrastructure/database/schema.js";
import { AppError } from "../core/app-error.js";
import { DatabaseService } from "../database/database.service.js";
let EventsService = class EventsService {
    database;
    constructor(database) {
        this.database = database;
    }
    async listPublic() {
        const rows = await this.database.db
            .select()
            .from(events)
            .where(eq(events.status, "published"))
            .orderBy(asc(events.startDate));
        return rows.map(toPublicEvent);
    }
    async getPublic(slug) {
        const [event] = await this.database.db
            .select()
            .from(events)
            .where(and(eq(events.slug, slug), eq(events.status, "published")))
            .limit(1);
        return event ? toPublicEvent(event) : null;
    }
    async listAdmin() {
        const rows = await this.database.db.select().from(events).orderBy(asc(events.startDate));
        return rows.map(toCmsEvent);
    }
    async create(value) {
        const input = parseEventInput(value);
        const [event] = await this.database.db
            .insert(events)
            .values({
            ...toInsertValues(input),
            slug: slugify(input.title),
            publishedAt: input.status === "published" ? new Date() : null,
        })
            .returning();
        return toCmsEvent(event);
    }
    async update(id, value) {
        if (!isUuid(id)) {
            throw new AppError(400, "Event identifier is invalid.", "INVALID_EVENT_ID");
        }
        const input = parseEventInput(value);
        const [event] = await this.database.db
            .update(events)
            .set({
            ...toInsertValues(input),
            publishedAt: input.status === "published" ? new Date() : null,
            updatedAt: new Date(),
        })
            .where(eq(events.id, id))
            .returning();
        if (!event) {
            throw new AppError(404, "Event was not found.", "EVENT_NOT_FOUND");
        }
        return toCmsEvent(event);
    }
    async delete(id) {
        if (!isUuid(id)) {
            throw new AppError(400, "Event identifier is invalid.", "INVALID_EVENT_ID");
        }
        const [deleted] = await this.database.db
            .delete(events)
            .where(eq(events.id, id))
            .returning({ id: events.id });
        if (!deleted) {
            throw new AppError(404, "Event was not found.", "EVENT_NOT_FOUND");
        }
    }
};
EventsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], EventsService);
export { EventsService };
function parseEventInput(value) {
    const result = validateEventInput(value);
    if (!result.success) {
        throw new AppError(422, "Request validation failed.", "VALIDATION_ERROR");
    }
    return result.data;
}
function toInsertValues(input) {
    return {
        title: input.title,
        subtitle: input.subtitle,
        description: input.description,
        longDescription: input.longDescription,
        startDate: input.date,
        endDate: input.endDate || null,
        time: input.time,
        venue: input.venue,
        city: input.city,
        category: input.category,
        poster: input.poster,
        banner: input.banner,
        gallery: input.gallery,
        schedule: input.schedule,
        organizer: input.organizer,
        organizerRole: input.organizerRole,
        organizerPhoto: input.organizerPhoto,
        capacity: input.capacity,
        tags: input.tags,
        status: input.status,
        featured: input.featured,
    };
}
function toCmsEvent(event) {
    return {
        id: event.id,
        slug: event.slug,
        title: event.title,
        subtitle: event.subtitle,
        description: event.description,
        longDescription: event.longDescription,
        date: event.startDate,
        ...(event.endDate ? { endDate: event.endDate } : {}),
        time: event.time,
        venue: event.venue,
        city: event.city,
        category: event.category,
        poster: event.poster,
        banner: event.banner,
        gallery: event.gallery,
        schedule: event.schedule,
        organizer: event.organizer,
        organizerRole: event.organizerRole,
        organizerPhoto: event.organizerPhoto,
        capacity: event.capacity,
        registered: event.registered,
        tags: event.tags,
        status: toEventStatus(event.status),
        featured: event.featured,
    };
}
function toEventStatus(value) {
    if (["draft", "published", "scheduled", "archived"].includes(value)) {
        return value;
    }
    throw new AppError(500, "Event has an invalid publication status.", "INVALID_EVENT_STATUS");
}
function toPublicEvent(event) {
    const { status: _status, ...publicEvent } = toCmsEvent(event);
    return { ...publicEvent, id: event.slug };
}
function slugify(title) {
    return title
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "event";
}
function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
