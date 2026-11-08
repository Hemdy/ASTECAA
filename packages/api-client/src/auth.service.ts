import { Injectable } from '@angular/core';
import { getAstecApiUrl } from '@astec/config';

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
}

export interface ApplicationIdentity {
  id: string;
  email: string;
  full_name: string;
  role: 'alumni' | 'admin' | 'super_admin';
  is_active: boolean;
  phone: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  async getSession(): Promise<AuthSessionUser | null> {
    const session = await this.request<{ user?: AuthSessionUser } | null>(
      '/api/auth/get-session'
    );
    return session?.user ?? null;
  }

  getIdentity(): Promise<ApplicationIdentity> {
    return this.request('/api/v1/me');
  }

  async signIn(email: string, password: string, rememberMe: boolean): Promise<void> {
    await this.request('/api/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
  }

  async signOut(): Promise<void> {
    await this.request('/api/auth/sign-out', { method: 'POST' });
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
      throw new Error(readErrorMessage(body) ?? `Authentication request failed (${response.status}).`);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }
}

function readErrorMessage(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }

  if ('message' in body && typeof body.message === 'string') {
    return body.message;
  }
  if ('error' in body && typeof body.error === 'string') {
    return body.error;
  }
  return null;
}
