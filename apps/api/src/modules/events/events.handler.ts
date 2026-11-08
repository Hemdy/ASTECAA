import { and, asc, eq } from 'drizzle-orm';
import type { createDatabase } from '../../db/database.ts';
import { ApiError, errorResponse } from '../../core/errors.ts';
import { parseJson } from '../../validation/parse-json.ts';
import { validateEventInput } from '@astec/validation';
import type { CmsEvent, EventInput, EventStatus, PublicEvent } from '@astec/types';
import { requireAdmin } from '../../middleware/auth.ts';
import { events } from '../../../../../infrastructure/database/schema.ts';
import type { AuthConfiguration } from '../../auth/auth.ts';

type Database = ReturnType<typeof createDatabase>;

export async function handleEventsRequest(
  request: Request,
  database: Database,
  auth: AuthConfiguration
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const requestId = crypto.randomUUID();

  try {
    if (path === '/api/v1/events' && request.method === 'GET') {
      const rows = await database
        .select()
        .from(events)
        .where(eq(events.status, 'published'))
        .orderBy(asc(events.startDate));
      return Response.json(rows.map(toPublicEvent), { headers: noStoreHeaders() });
    }

    if (path.startsWith('/api/v1/events/') && request.method === 'GET') {
      const slug = decodePathSegment(path.slice('/api/v1/events/'.length));
      const [event] = await database
        .select()
        .from(events)
        .where(and(eq(events.slug, slug), eq(events.status, 'published')))
        .limit(1);
      return Response.json(event ? toPublicEvent(event) : null, {
        headers: noStoreHeaders(),
      });
    }

    if (path === '/api/admin/v1/events' && request.method === 'GET') {
      await requireAdmin(request, database, auth);
      const rows = await database.select().from(events).orderBy(asc(events.startDate));
      return Response.json(rows.map(toCmsEvent), { headers: noStoreHeaders() });
    }

    if (path === '/api/admin/v1/events' && request.method === 'POST') {
      await requireAdmin(request, database, auth);
      const input = await parseJson<EventInput>(request, validateEventInput);
      const slug = slugify(input.title);
      const [event] = await database
        .insert(events)
        .values({
          ...toInsertValues(input),
          slug,
          publishedAt: input.status === 'published' ? new Date() : null,
        })
        .returning();
      return Response.json(toCmsEvent(event), {
        status: 201,
        headers: noStoreHeaders(),
      });
    }

    if (path.startsWith('/api/admin/v1/events/')) {
      await requireAdmin(request, database, auth);
      const id = decodePathSegment(path.slice('/api/admin/v1/events/'.length));
      if (!isUuid(id)) {
        throw new ApiError(400, 'Event identifier is invalid.', 'INVALID_EVENT_ID');
      }

      if (request.method === 'PATCH') {
        const input = await parseJson<EventInput>(request, validateEventInput);
        const [event] = await database
          .update(events)
          .set({
            ...toInsertValues(input),
            publishedAt: input.status === 'published' ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(events.id, id))
          .returning();
        if (!event) {
          throw new ApiError(404, 'Event was not found.', 'EVENT_NOT_FOUND');
        }
        return Response.json(toCmsEvent(event), { headers: noStoreHeaders() });
      }

      if (request.method === 'DELETE') {
        const [deleted] = await database
          .delete(events)
          .where(eq(events.id, id))
          .returning({ id: events.id });
        if (!deleted) {
          throw new ApiError(404, 'Event was not found.', 'EVENT_NOT_FOUND');
        }
        return new Response(null, { status: 204, headers: noStoreHeaders() });
      }
    }

    throw new ApiError(404, 'The requested event endpoint was not found.', 'NOT_FOUND');
  } catch (error) {
    if (isUniqueViolation(error)) {
      return errorResponse(
        new ApiError(409, 'An event with this title already exists.', 'EVENT_SLUG_CONFLICT'),
        requestId
      );
    }
    return errorResponse(error, requestId);
  }
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
  if (
    value === 'draft' ||
    value === 'published' ||
    value === 'scheduled' ||
    value === 'archived'
  ) {
    return value;
  }
  throw new ApiError(500, 'Event has an invalid publication status.', 'INVALID_EVENT_STATUS');
}

function toPublicEvent(event: typeof events.$inferSelect): PublicEvent {
  const { status: _status, ...publicEvent } = toCmsEvent(event);
  return { ...publicEvent, id: event.slug };
}

function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'event';
}

function decodePathSegment(value: string): string {
  try {
    const decoded = decodeURIComponent(value);
    if (!decoded || decoded.includes('/')) {
      throw new ApiError(400, 'Event identifier is invalid.', 'INVALID_EVENT_ID');
    }
    return decoded;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(400, 'Event identifier is invalid.', 'INVALID_EVENT_ID');
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function noStoreHeaders(): Headers {
  return new Headers({ 'Cache-Control': 'no-store' });
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}
