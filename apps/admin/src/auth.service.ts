import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApiService } from '@astec/api-client';
import type { AdminProfile } from '@astec/types';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);

  session = signal<boolean | null>(null);
  userEmail = signal<string | null>(null);
  profile = signal<AdminProfile | null>(null);
  loading = signal(true);
  authError = signal<string | null>(null);

  private readonly readyPromise = this.initializeAuth();

  private async initializeAuth(): Promise<void> {
    try {
      const user = await this.authApi.getSession();
      if (!user) {
        this.clearSession();
        return;
      }

      this.session.set(true);
      this.userEmail.set(user.email);
      await this.loadProfile();
    } catch (error) {
      console.error('Authentication session could not be restored.', error);
      this.clearSession();
      this.authError.set(this.friendlyError(error));
    } finally {
      this.loading.set(false);
    }
  }

  ready(): Promise<void> {
    return this.readyPromise;
  }

  async signIn(email: string, password: string, remember: boolean): Promise<boolean> {
    this.authError.set(null);
    this.loading.set(true);
    try {
      await this.authApi.signIn(email, password, remember);
      const user = await this.authApi.getSession();
      if (!user) {
        throw new Error('Sign-in completed without an active session.');
      }

      this.session.set(true);
      this.userEmail.set(user.email);
      await this.loadProfile();

      const profile = this.profile();
      if (!profile || !profile.is_active) {
        await this.authApi.signOut();
        this.clearSession();
        this.authError.set('Your administrator account is inactive or unavailable.');
        return false;
      }
      if (profile.role !== 'admin' && profile.role !== 'super_admin') {
        await this.authApi.signOut();
        this.clearSession();
        this.authError.set('This account does not have administrator access.');
        return false;
      }
      return true;
    } catch (error) {
      this.clearSession();
      this.authError.set(this.friendlyError(error));
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async signOut(): Promise<void> {
    await this.authApi.signOut();
    this.clearSession();
    await this.router.navigate(['/admin/login']);
  }

  isAuthenticated(): boolean {
    return this.session() === true;
  }

  isAdmin(): boolean {
    const profile = this.profile();
    return !!profile?.is_active &&
      (profile.role === 'admin' || profile.role === 'super_admin');
  }

  isSuperAdmin(): boolean {
    const profile = this.profile();
    return !!profile?.is_active && profile.role === 'super_admin';
  }

  private async loadProfile(): Promise<void> {
    const identity = await this.authApi.getIdentity();
    this.profile.set({
      id: identity.id,
      full_name: identity.full_name,
      role: identity.role,
      is_active: identity.is_active,
      email: identity.email,
      phone: identity.phone,
    });
  }

  private clearSession(): void {
    this.session.set(false);
    this.userEmail.set(null);
    this.profile.set(null);
  }

  private friendlyError(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (/invalid.*credentials|incorrect email or password/i.test(message)) {
      return 'Incorrect email or password.';
    }
    if (/rate.?limit/i.test(message)) {
      return 'Too many attempts. Please wait a moment.';
    }
    return message || 'Something went wrong. Please try again.';
  }
}
