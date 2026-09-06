import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../supabase';

export type UserRole = 'alumni' | 'admin' | 'super_admin';

export interface AdminProfile {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private router = inject(Router);

  session = signal<boolean | null>(null);
  userEmail = signal<string | null>(null);
  profile = signal<AdminProfile | null>(null);

  loading = signal(true);
  authError = signal<string | null>(null);

  private readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = this.initializeAuth();

    supabase.auth.onAuthStateChange((_event, session) => {
      void this.handleAuthState(session);
    });
  }

  // ---------------------------------------------------------
  // INITIAL AUTHENTICATION
  // ---------------------------------------------------------

  private async initializeAuth(): Promise<void> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      await this.handleAuthState(data.session);
    } catch (error) {
      console.error('Auth initialization failed:', error);

      this.session.set(false);
      this.userEmail.set(null);
      this.profile.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  // ---------------------------------------------------------
  // AUTH STATE
  // ---------------------------------------------------------

  private async handleAuthState(session: any): Promise<void> {
    this.session.set(!!session);

    this.userEmail.set(
      session?.user?.email ?? null
    );

    if (!session?.user) {
      this.profile.set(null);
      this.loading.set(false);
      return;
    }

    console.log('Authenticated Supabase user:', session.user);

    await this.loadProfile(session.user.id);

    this.loading.set(false);
  }

  // ---------------------------------------------------------
  // LOAD PROFILE
  // ---------------------------------------------------------

  private async loadProfile(userId: string): Promise<void> {
    console.log('Loading profile for user:', userId);

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        is_active,
        email,
        phone,
        avatar_url,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to load profile:', error);

      this.profile.set(null);
      return;
    }

    if (!data) {
      console.error(
        'No profile found for authenticated user:',
        userId
      );

      this.profile.set(null);
      return;
    }

    console.log('Profile loaded successfully:', data);

    this.profile.set(data as AdminProfile);
  }

  // ---------------------------------------------------------
  // READY
  // ---------------------------------------------------------

  ready(): Promise<void> {
    return this.readyPromise;
  }

  // ---------------------------------------------------------
  // SIGN IN
  // ---------------------------------------------------------

  async signIn(
    email: string,
    password: string,
    remember: boolean
  ): Promise<boolean> {

    this.authError.set(null);
    this.loading.set(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw error;
      }

      if (!data.user) {
        this.authError.set(
          'Login succeeded but no user was returned.'
        );

        return false;
      }

      console.log('Login successful:', data.user);

      this.session.set(true);
      this.userEmail.set(data.user.email ?? null);

      // Load the profile associated with auth.users.id
      await this.loadProfile(data.user.id);

      const currentProfile = this.profile();

      console.log(
        'Profile after login:',
        currentProfile
      );

      // Make sure a profile exists
      if (!currentProfile) {
        await supabase.auth.signOut();

        this.session.set(false);
        this.userEmail.set(null);

        this.authError.set(
          'Your account exists, but no profile was found.'
        );

        return false;
      }

      // Make sure account is active
      if (!currentProfile.is_active) {
        await supabase.auth.signOut();

        this.session.set(false);
        this.userEmail.set(null);
        this.profile.set(null);

        this.authError.set(
          'Your administrator account is inactive.'
        );

        return false;
      }

      // Make sure role is allowed
      if (
        currentProfile.role !== 'admin' &&
        currentProfile.role !== 'super_admin'
      ) {
        await supabase.auth.signOut();

        this.session.set(false);
        this.userEmail.set(null);
        this.profile.set(null);

        this.authError.set(
          `Your account has the role "${currentProfile.role}" and does not have administrator access.`
        );

        return false;
      }

      console.log(
        'Administrator access confirmed:',
        currentProfile.role
      );

      return true;

    } catch (err: any) {

      console.error('Login error:', err);

      this.authError.set(
        this.friendlyError(err)
      );

      return false;

    } finally {
      this.loading.set(false);
    }
  }

  // ---------------------------------------------------------
  // SIGN OUT
  // ---------------------------------------------------------

  async signOut(): Promise<void> {
    await supabase.auth.signOut();

    this.session.set(false);
    this.userEmail.set(null);
    this.profile.set(null);

    await this.router.navigate(['/admin/login']);
  }

  // ---------------------------------------------------------
  // PASSWORD RESET
  // ---------------------------------------------------------

  async resetPassword(
    email: string
  ): Promise<boolean> {

    this.authError.set(null);

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo:
            `${window.location.origin}/admin/login`,
        });

      if (error) {
        throw error;
      }

      return true;

    } catch (err: any) {

      this.authError.set(
        this.friendlyError(err)
      );

      return false;
    }
  }

  // ---------------------------------------------------------
  // AUTHENTICATION CHECK
  // ---------------------------------------------------------

  isAuthenticated(): boolean {
    return this.session() === true;
  }

  // ---------------------------------------------------------
  // ADMIN CHECK
  // ---------------------------------------------------------

  isAdmin(): boolean {
    const currentProfile = this.profile();

    if (!currentProfile) {
      return false;
    }

    if (!currentProfile.is_active) {
      return false;
    }

    return (
      currentProfile.role === 'admin' ||
      currentProfile.role === 'super_admin'
    );
  }

  // ---------------------------------------------------------
  // SUPER ADMIN CHECK
  // ---------------------------------------------------------

  isSuperAdmin(): boolean {
    const currentProfile = this.profile();

    return (
      !!currentProfile &&
      currentProfile.is_active === true &&
      currentProfile.role === 'super_admin'
    );
  }

  // ---------------------------------------------------------
  // ERROR HANDLING
  // ---------------------------------------------------------

  private friendlyError(err: any): string {

    const msg = err?.message ?? '';

    if (
      msg.includes('Invalid login credentials')
    ) {
      return 'Incorrect email or password.';
    }

    if (
      msg.includes('Email not confirmed')
    ) {
      return 'This account has not been confirmed yet.';
    }

    if (
      msg.toLowerCase().includes('rate limit')
    ) {
      return 'Too many attempts. Please wait a moment.';
    }

    return (
      msg ||
      'Something went wrong. Please try again.'
    );
  }
}
