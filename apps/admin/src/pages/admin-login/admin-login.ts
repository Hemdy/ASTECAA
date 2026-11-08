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

  email = '';
  password = '';
  remember = true;
  showPw = signal(false);
  submitting = signal(false);

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

}
