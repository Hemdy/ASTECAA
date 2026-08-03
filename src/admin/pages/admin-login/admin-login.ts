import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-login.html',
})
export class AdminLogin {
  auth = inject(AdminAuthService);
  router = inject(Router);

  mode = signal<'login' | 'forgot'>('login');
  email = '';
  password = '';
  remember = true;
  resetEmail = '';
  showPw = signal(false);
  submitting = signal(false);
  resetSent = signal(false);

  constructor() {
    this.auth.ready().then(() => {
      if (this.auth.isAuthenticated()) {
        this.router.navigate(['/admin/dashboard']);
      }
    });
  }

  async submitLogin(e: Event) {
    e.preventDefault();
    if (!this.email || !this.password) return;
    this.submitting.set(true);
    this.auth.authError.set(null);
    const ok = await this.auth.signIn(this.email, this.password, this.remember);
    this.submitting.set(false);
    if (ok) {
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      this.router.navigate([redirect || '/admin/dashboard']);
    }
  }

  async submitReset(e: Event) {
    e.preventDefault();
    if (!this.resetEmail) return;
    this.submitting.set(true);
    this.auth.authError.set(null);
    this.resetSent.set(false);
    const ok = await this.auth.resetPassword(this.resetEmail);
    this.submitting.set(false);
    if (ok) this.resetSent.set(true);
  }

  backToLogin() {
    this.mode.set('login');
    this.resetSent.set(false);
    this.auth.authError.set(null);
  }
}
