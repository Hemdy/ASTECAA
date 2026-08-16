import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MemberAuthService } from '../../services/member-auth';
import { ToastService } from '../../ui-state';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  auth = inject(MemberAuthService);
  router = inject(Router);
  toast = inject(ToastService);

  email = '';
  password = '';
  showPw = signal(false);
  submitting = signal(false);

  constructor() {
    this.auth.ready().then(() => {
      if (this.auth.isAuthenticated()) {
        this.router.navigate(['/']);
      }
    });
  }

  canSubmit(): boolean {
    return this.email.trim().length > 0 && this.password.length > 0;
  }

  async submit(e: Event) {
    e.preventDefault();
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.auth.authError.set(null);
    const ok = await this.auth.signIn(this.email.trim(), this.password);
    this.submitting.set(false);
    if (ok) {
      this.toast.show(`Welcome back, ${this.auth.displayName().split(' ')[0]}!`);
      this.router.navigate(['/']);
    }
  }
}
