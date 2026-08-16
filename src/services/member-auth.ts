import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../supabase';

export interface MemberProfile {
  id: string;
  full_name: string;
  graduation_set: string;
  email: string;
  phone: string | null;
}

@Injectable({ providedIn: 'root' })
export class MemberAuthService {
  private router = inject(Router);

  session = signal<boolean>(false);
  profile = signal<MemberProfile | null>(null);
  loading = signal(true);
  authError = signal<string | null>(null);

  private readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) {
          this.session.set(true);
          return this.loadProfile();
        }
        return undefined;
      })
      .catch(() => {
        this.session.set(false);
      })
      .finally(() => {
        this.loading.set(false);
      });

    supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (session) {
          this.session.set(true);
          await this.loadProfile();
        } else {
          this.session.set(false);
          this.profile.set(null);
        }
        this.loading.set(false);
      })();
    });
  }

  ready(): Promise<void> {
    return this.readyPromise;
  }

  private async loadProfile() {
    const { data, error } = await supabase
      .from('members')
      .select('id, full_name, graduation_set, email, phone')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to load member profile:', error.message);
      return;
    }
    this.profile.set(data as MemberProfile | null);
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, graduation_set: graduationSet, phone } },
      });
      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error('Account creation failed — no user ID returned.');

      const { error: profileError } = await supabase.from('members').insert({
        id: userId,
        full_name: fullName,
        graduation_set: graduationSet,
        email,
        phone: phone || null,
      });
      if (profileError) throw profileError;

      this.session.set(true);
      await this.loadProfile();
      return true;
    } catch (err: any) {
      this.authError.set(this.friendlyError(err));
      return false;
    }
  }

  async signIn(email: string, password: string): Promise<boolean> {
    this.authError.set(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this.session.set(true);
      await this.loadProfile();
      return true;
    } catch (err: any) {
      this.authError.set(this.friendlyError(err));
      return false;
    }
  }

  async signOut() {
    await supabase.auth.signOut();
    this.session.set(false);
    this.profile.set(null);
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    return this.session() === true;
  }

  displayName(): string {
    return this.profile()?.full_name ?? 'Member';
  }

  private friendlyError(err: any): string {
    const msg = err?.message ?? '';
    if (msg.includes('already registered') || msg.includes('already been registered'))
      return 'An account with this email already exists. Please sign in instead.';
    if (msg.includes('Invalid login credentials')) return 'Incorrect email or password.';
    if (msg.includes('Email not confirmed')) return 'This account has not been confirmed yet.';
    if (msg.includes('User not found')) return 'No account found with that email.';
    if (msg.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.';
    if (msg.includes('Password should be at least'))
      return 'Password must be at least 6 characters long.';
    return msg || 'Something went wrong. Please try again.';
  }
}
