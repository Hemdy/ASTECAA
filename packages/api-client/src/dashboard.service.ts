import { Injectable } from '@angular/core';
import { getAstecApiUrl } from '@astec/config';
import type { DashboardStatsItem } from '@astec/types';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  async getStats(): Promise<DashboardStatsItem> {
    return this.request<DashboardStatsItem>('/api/admin/v1/dashboard/stats');
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${getAstecApiUrl()}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const msg =
        typeof body === 'object' && body !== null && 'error' in body
          ? (body as any).error?.message || (body as any).error
          : `Request failed (${response.status})`;
      throw new Error(msg);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }
}
