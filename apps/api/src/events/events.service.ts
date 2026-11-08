import { Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { events } from '@astec/database';
import { validateEventInput } from '@astec/validation';
import type { CmsEvent, EventInput, EventStatus, PublicEvent } from '@astec/types';
import { AppError } from '../core/app-error.js';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class EventsService {
  constructor(private readonly database: DatabaseService) {}

  async listPublic(): Promise<PublicEvent[]> {
    const rows = await this.database.db
      .select()
      .from(events)
      .where(eq(events.status, 'published'))
      .orderBy(asc(events.startDate));
    return rows.map(toPublicEvent);
  }

  async getPublic(slug: string): Promise<PublicEvent | null> {
    const [event] = await this.database.db
      .select()
      .from(events)
      .where(and(eq(events.slug, slug), eq(events.status, 'published')))
      .limit(1);
    return event ? toPublicEvent(event) : null;
  }

  async listAdmin(): Promise<CmsEvent[]> {
    const rows = await this.database.db
      .select()
      .from(events)
      .orderBy(asc(events.startDate));
    return rows.map(toCmsEvent);
  }

  async create(value: unknown): Promise<CmsEvent> {
    const input = parseEventInput(value);
    try {
      const [event] = await this.database.db
        .insert(events)
        .values({
          ...toInsertValues(input),
          slug: slugify(input.title),
          publishedAt: input.status === 'published' ? new Date() : null,
        })
        .returning();
      return toCmsEvent(event);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async update(id: string, value: unknown): Promise<CmsEvent> {
    if (!isUuid(id)) {
      throw new AppError(400, 'Event identifier is invalid.', 'INVALID_EVENT_ID');
    }
    const input = parseEventInput(value);
    try {
      const [event] = await this.database.db
        .update(events)
        .set({
          ...toInsertValues(input),
          publishedAt: input.status === 'published' ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(events.id, id))
        .returning();
      if (!event) {
        throw new AppError(404, 'Event was not found.', 'EVENT_NOT_FOUND');
      }
      return toCmsEvent(event);
    } catch (error) {
      throw mapDatabaseError(error);
    }
  }

  async delete(id: string): Promise<void> {
    if (!isUuid(id)) {
      throw new AppError(400, 'Event identifier is invalid.', 'INVALID_EVENT_ID');
    }
    const [deleted] = await this.database.db
      .delete(events)
      .where(eq(events.id, id))
      .returning({ id: events.id });
    if (!deleted) {
      throw new AppError(404, 'Event was not found.', 'EVENT_NOT_FOUND');
    }
  }
}

function parseEventInput(value: unknown): EventInput {
  const result = validateEventInput(value);
  if (!result.success) {
    throw new AppError(422, 'Request validation failed.', 'VALIDATION_ERROR', result.issues);
  }
  return result.data;
}

function toInsertValues(input: EventInput) {
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

function toCmsEvent(event: typeof events.$inferSelect): CmsEvent {
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

function toEventStatus(value: string): EventStatus {
  if (['draft', 'published', 'scheduled', 'archived'].includes(value)) {
    return value as EventStatus;
  }
  throw new AppError(500, 'Event has an invalid publication status.', 'INVALID_EVENT_STATUS');
}

function toPublicEvent(event: typeof events.$inferSelect): PublicEvent {
  const { status: _status, ...publicEvent } = toCmsEvent(event);
  return { ...publicEvent, id: event.slug };
}

function slugify(title: string): string {
  return (
    title
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'event'
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function mapDatabaseError(error: unknown): unknown {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  ) {
    return new AppError(
      409,
      'An event with this title already exists.',
      'EVENT_SLUG_CONFLICT',
    );
  }
  return error;
}
