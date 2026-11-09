import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, or, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { adminNotifications, appUsers, eventRegistrations, events } from '@astec/database';
import { validateEventInput } from '@astec/validation';
import type { CmsEvent, EventInput, EventStatus, PublicEvent } from '@astec/types';
import { AppError } from '../core/app-error.js';
import { DatabaseService } from '../database/database.service.js';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class EventsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly email: EmailService,
  ) {}

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

  async getUserRegistrations(idOrEmail: string) {
    const db = this.database.db;
    const isId = isUuid(idOrEmail);
    const emailNorm = idOrEmail.trim().toLowerCase();

    const condition = isId
      ? or(eq(eventRegistrations.userId, idOrEmail), eq(eventRegistrations.emailNormalized, emailNorm))
      : eq(eventRegistrations.emailNormalized, emailNorm);

    const rows = await db
      .select({
        id: eventRegistrations.id,
        eventId: eventRegistrations.eventId,
        name: eventRegistrations.name,
        email: eventRegistrations.emailNormalized,
        phone: eventRegistrations.phone,
        graduationYear: eventRegistrations.graduationYear,
        status: eventRegistrations.status,
        createdAt: eventRegistrations.createdAt,
        eventTitle: events.title,
        eventSlug: events.slug,
        eventDate: events.startDate,
        eventVenue: events.venue,
        eventCategory: events.category,
        eventPoster: events.poster,
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(condition)
      .orderBy(desc(eventRegistrations.createdAt));

    return rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));
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

  async register(
    eventIdOrSlug: string,
    data: { name: string; email: string; phone?: string; graduationYear?: string; userId?: string },
  ) {
    const db = this.database.db;
    const emailNormalized = data.email.trim().toLowerCase();

    const eventCondition = isUuid(eventIdOrSlug)
      ? eq(events.id, eventIdOrSlug)
      : eq(events.slug, eventIdOrSlug);

    const [event] = await db
      .select()
      .from(events)
      .where(eventCondition)
      .limit(1);

    if (!event) {
      throw new AppError(404, 'Event was not found.', 'EVENT_NOT_FOUND');
    }

    if (event.registered >= event.capacity) {
      throw new AppError(400, 'This event is currently at full capacity.', 'EVENT_FULL');
    }

    const [existing] = await db
      .select({ id: eventRegistrations.id })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, event.id),
          eq(eventRegistrations.emailNormalized, emailNormalized),
        ),
      )
      .limit(1);

    if (existing) {
      throw new AppError(400, 'You are already registered for this event.', 'ALREADY_REGISTERED');
    }

    let verifiedUserId: string | null = null;
    if (data.userId && isUuid(data.userId)) {
      const user = await db
        .select({ id: appUsers.id })
        .from(appUsers)
        .where(eq(appUsers.id, data.userId))
        .limit(1);
      if (user.length > 0) {
        verifiedUserId = user[0].id;
      }
    }

    if (!verifiedUserId) {
      const user = await db
        .select({ id: appUsers.id })
        .from(appUsers)
        .where(eq(appUsers.emailNormalized, emailNormalized))
        .limit(1);
      if (user.length > 0) {
        verifiedUserId = user[0].id;
      }
    }

    await db.transaction(async (tx) => {
      await tx.insert(eventRegistrations).values({
        eventId: event.id,
        userId: verifiedUserId,
        name: data.name.trim(),
        emailNormalized,
        phone: data.phone?.trim() || null,
        graduationYear: data.graduationYear?.trim() || null,
        status: 'confirmed',
      });

      await tx
        .update(events)
        .set({ registered: sql`${events.registered} + 1` })
        .where(eq(events.id, event.id));
    });

    // Generate admin notification
    void db
      .insert(adminNotifications)
      .values({
        id: randomUUID(),
        type: 'event',
        title: 'New Event Registration',
        message: `${data.name.trim()} registered for "${event.title}"`,
        link: '/admin/events',
        read: false,
      })
      .catch(() => {});

    // Send confirmation email asynchronously via Resend
    void this.email
      .sendEventConfirmation(
        data.email,
        {
          title: event.title,
          date: event.startDate,
          venue: event.venue,
        },
        data.name.trim(),
      )
      .catch(() => {});

    return {
      success: true,
      message: `Registration confirmed for ${event.title}!`,
      eventId: event.id,
    };
  }

  async getAttendees(eventIdOrSlug: string) {
    const db = this.database.db;
    const eventCondition = isUuid(eventIdOrSlug)
      ? eq(events.id, eventIdOrSlug)
      : eq(events.slug, eventIdOrSlug);

    const [event] = await db
      .select({ id: events.id })
      .from(events)
      .where(eventCondition)
      .limit(1);

    if (!event) {
      throw new AppError(404, 'Event not found.', 'EVENT_NOT_FOUND');
    }

    return db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, event.id))
      .orderBy(desc(eventRegistrations.createdAt));
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

