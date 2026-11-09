import { Injectable } from '@angular/core';
import { getAstecApiUrl } from '@astec/config';
import type { CmsEvent, EventInput, PublicEvent } from '@astec/types';

@Injectable({ providedIn: 'root' })
export class EventsApiService {
  async listPublic(): Promise<PublicEvent[]> {
    return this.request('/api/v1/events');
  }

  async getPublic(slug: string): Promise<PublicEvent | null> {
    return this.request(`/api/v1/events/${encodeURIComponent(slug)}`);
  }

  async listAdmin(): Promise<CmsEvent[]> {
    return this.request('/api/admin/v1/events', {}, true);
  }

  async create(input: EventInput): Promise<CmsEvent> {
    return this.request(
      '/api/admin/v1/events',
      { method: 'POST', body: JSON.stringify(input) },
      true
    );
  }

  async update(id: string, input: EventInput): Promise<CmsEvent> {
    return this.request(
      `/api/admin/v1/events/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(input) },
      true
    );
  }

  async delete(id: string): Promise<void> {
    await this.request(
      `/api/admin/v1/events/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      true
    );
  }

  async register(
    id: string,
    data: { name: string; email: string; phone?: string; graduationYear?: string; userId?: string },
  ): Promise<{ success: boolean; message: string; eventId: string }> {
    return this.request(
      `/api/v1/events/${encodeURIComponent(id)}/register`,
      { method: 'POST', body: JSON.stringify(data) },
      true
    );
  }

  async getUserRegistrations(idOrEmail: string): Promise<any[]> {
    return this.request(`/api/v1/events/user/${encodeURIComponent(idOrEmail)}/registrations`);
  }

  async getAttendees(id: string): Promise<any[]> {
    return this.request(
      `/api/admin/v1/events/${encodeURIComponent(id)}/attendees`,
      {},
      true
    );
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    authenticated = false
  ): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${getAstecApiUrl()}${path}`, {
      ...init,
      headers,
      credentials: authenticated ? 'include' : 'same-origin',
      cache: 'no-store',
    });
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const message =
        typeof body === 'object' &&
        body !== null &&
        'error' in body &&
        typeof body.error === 'object' &&
        body.error !== null &&
        'message' in body.error &&
        typeof body.error.message === 'string'
          ? body.error.message
          : typeof body === 'object' &&
              body !== null &&
              'error' in body &&
              typeof body.error === 'string'
            ? body.error
            : `API request failed (${response.status}).`;
      throw new Error(message);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }
}
