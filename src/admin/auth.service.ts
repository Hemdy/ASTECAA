import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../supabase';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private router = inject(Router);

  session = signal<boolean | null>(null);
  userEmail = signal<string | null>(null);
  loading = signal(true);
  authError = signal<string | null>(null);

  private readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = supabase.auth
      .getSession()
      .then(({ data }) => {
        this.session.set(!!data.session);
        this.userEmail.set(data.session?.user?.email ?? null);
      })
      .catch(() => {
        this.session.set(false);
      })
      .finally(() => {
        this.loading.set(false);
      });

    supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        this.session.set(!!session);
        this.userEmail.set(session?.user?.email ?? null);
        this.loading.set(false);
      })();
    });
  }

  ready(): Promise<void> {
    return this.readyPromise;
  }

  async signIn(email: string, password: string, remember: boolean): Promise<boolean> {
    this.authError.set(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this.session.set(true);
      this.userEmail.set(data.user?.email ?? null);
      return true;
    } catch (err: any) {
      this.authError.set(this.friendlyError(err));
      return false;
    }
  }

  async signOut() {
    await supabase.auth.signOut();
    this.session.set(false);
    this.userEmail.set(null);
    this.router.navigate(['/admin/login']);
  }

  async resetPassword(email: string): Promise<boolean> {
    this.authError.set(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/login`,
      });
      if (error) throw error;
      return true;
    } catch (err: any) {
      this.authError.set(this.friendlyError(err));
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.session() === true;
  }

  private friendlyError(err: any): string {
    const msg = err?.message ?? '';
    if (msg.includes('Invalid login credentials')) return 'Incorrect email or password.';
    if (msg.includes('Email not confirmed')) return 'This account has not been confirmed yet.';
    if (msg.includes('User not found')) return 'No administrator account found with that email.';
    if (msg.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.';
    return msg || 'Something went wrong. Please try again.';
  }
}
