import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApiService, UsersApiService } from '@astec/api-client';
import type { MemberProfile } from '@astec/types';

@Injectable({ providedIn: 'root' })
export class MemberAuthService {
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly usersApi = inject(UsersApiService);

  session = signal(false);
  profile = signal<MemberProfile | null>(null);
  loading = signal(true);
  authError = signal<string | null>(null);

  private readonly readyPromise = this.initializeAuth();

  private async initializeAuth(): Promise<void> {
    try {
      const user = await this.authApi.getSession();
      if (user) {
        this.session.set(true);
        await this.loadProfile();
      }
    } catch (error) {
      console.error('Member authentication session could not be restored.', error);
      this.authError.set(this.errorMessage(error));
      this.clearSession();
    } finally {
      this.loading.set(false);
    }
  }

  ready(): Promise<void> {
    return this.readyPromise;
  }

  async signUp(
    fullName: string,
    graduationSet: string,
    email: string,
    phone: string | null,
    password: string
  ): Promise<boolean> {
    this.authError.set(null);
    try {
      await this.authApi.signUp(email, password, fullName);
      await this.authApi.signIn(email, password, true);
      if (graduationSet || phone) {
        await this.usersApi
          .updateProfile({
            graduationSet: graduationSet || undefined,
            phone: phone || undefined,
          })
          .catch((err) => {
            console.warn('Profile details update notice:', err);
          });
      }
      this.session.set(true);
      await this.loadProfile();
      return true;
    } catch (error) {
      this.clearSession();
      this.authError.set(this.errorMessage(error));
      return false;
    }
  }

  async signIn(email: string, password: string): Promise<boolean> {
    this.authError.set(null);
    try {
      await this.authApi.signIn(email, password, true);
      const identity = await this.authApi.getIdentity();
      if (!identity.is_active) {
        await this.authApi.signOut();
        this.clearSession();
        this.authError.set('This account has been deactivated or suspended.');
        return false;
      }
      this.session.set(true);
      await this.loadProfile();
      return true;
    } catch (error) {
      this.clearSession();
      this.authError.set(this.errorMessage(error));
      return false;
    }
  }

  async signOut(): Promise<void> {
    await this.authApi.signOut();
    this.clearSession();
    await this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    return this.session();
  }

  displayName(): string {
    return this.profile()?.full_name ?? 'Member';
  }

  async updateProfile(updates: {
    fullName?: string;
    phone?: string;
    graduationSet?: string;
    department?: string;
    avatarUrl?: string;
    bio?: string;
  }): Promise<boolean> {
    try {
      const updated = await this.usersApi.updateProfile(updates);
      this.profile.set(updated);
      return true;
    } catch (error) {
      this.authError.set(this.errorMessage(error));
      return false;
    }
  }

  private async loadProfile(): Promise<void> {
    const identity = await this.authApi.getIdentity();
    if (!identity.is_active) {
      await this.authApi.signOut();
      this.clearSession();
      return;
    }
    const profile = await this.usersApi.getProfile().catch(() => null);
    this.profile.set(
      profile ?? {
        id: identity.id,
        full_name: identity.full_name,
        graduation_set: identity.graduation_year ?? '',
        email: identity.email,
        phone: identity.phone,
        department: identity.department,
        avatar_url: identity.avatar_url,
        bio: identity.bio,
      }
    );
  }

  private clearSession(): void {
    this.session.set(false);
    this.profile.set(null);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Authentication request failed.';
  }
}
