import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApiService } from '@astec/api-client';
import type { MemberProfile } from '@astec/types';

@Injectable({ providedIn: 'root' })
export class MemberAuthService {
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);

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
    _fullName: string,
    _graduationSet: string,
    _email: string,
    _phone: string | null,
    _password: string
  ): Promise<boolean> {
    this.authError.set(
      'Member registration is temporarily unavailable while the Neon registration workflow is being prepared.'
    );
    return false;
  }

  async signIn(email: string, password: string): Promise<boolean> {
    this.authError.set(null);
    try {
      await this.authApi.signIn(email, password, true);
      const identity = await this.authApi.getIdentity();
      if (identity.role !== 'alumni') {
        await this.authApi.signOut();
        this.clearSession();
        this.authError.set('This account does not have member access.');
        return false;
      }
      this.session.set(true);
      this.profile.set({
        id: identity.id,
        full_name: identity.full_name,
        graduation_set: '',
        email: identity.email,
        phone: identity.phone,
      });
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

  private async loadProfile(): Promise<void> {
    const identity = await this.authApi.getIdentity();
    if (identity.role !== 'alumni') {
      await this.authApi.signOut();
      this.clearSession();
      return;
    }
    this.profile.set({
      id: identity.id,
      full_name: identity.full_name,
      graduation_set: '',
      email: identity.email,
      phone: identity.phone,
    });
  }

  private clearSession(): void {
    this.session.set(false);
    this.profile.set(null);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Authentication request failed.';
  }
}
