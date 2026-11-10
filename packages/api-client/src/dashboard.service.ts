import { Injectable, signal } from '@angular/core';
import { getAstecApiUrl } from '@astec/config';
import { applyAuthHeaders, captureAuthHeader } from './token-storage.js';
import type { AdminSidebarCounts, DashboardStatsItem } from '@astec/types';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  readonly sidebarCounts = signal<AdminSidebarCounts | null>(null);
  private inFlightCounts: Promise<AdminSidebarCounts> | null = null;
  private lastCountsFetchedAt = 0;

  async getStats(period?: string): Promise<DashboardStatsItem> {
    const qs = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request<DashboardStatsItem>(`/api/admin/v1/dashboard/stats${qs}`);
  }

  async getSidebarCounts(): Promise<AdminSidebarCounts> {
    if (!this.inFlightCounts) {
      this.inFlightCounts = this.request<AdminSidebarCounts>('/api/admin/v1/dashboard/sidebar-counts')
        .then((counts) => {
          this.sidebarCounts.set(counts);
          this.lastCountsFetchedAt = Date.now();
          return counts;
        })
        .finally(() => {
          this.inFlightCounts = null;
        });
    }
    return this.inFlightCounts;
  }

  async refreshSidebarCounts(force = false): Promise<void> {
    if (!force && !this.inFlightCounts && Date.now() - this.lastCountsFetchedAt < 1500) {
      return;
    }
    try {
      await this.getSidebarCounts();
    } catch {
      // Non-fatal: keep last known counts if offline or unauthenticated
    }
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body) {
      headers.set('Content-Type', 'application/json');
    }
    applyAuthHeaders(headers);

    const response = await fetch(`${getAstecApiUrl()}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });
    captureAuthHeader(response);

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

