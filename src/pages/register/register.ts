import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MemberAuthService } from '../../services/member-auth';
import { ToastService } from '../../ui-state';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  auth = inject(MemberAuthService);
  router = inject(Router);
  toast = inject(ToastService);

  fullName = '';
  graduationSet = '';
  email = '';
  phone = '';
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
    return (
      this.fullName.trim().length > 0 &&
      this.graduationSet.trim().length > 0 &&
      this.email.trim().length > 0 &&
      this.password.length >= 6
    );
  }

  async submit(e: Event) {
    e.preventDefault();
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.auth.authError.set(null);
    const ok = await this.auth.signUp(
      this.fullName.trim(),
      this.graduationSet.trim(),
      this.email.trim(),
      this.phone.trim() || null,
      this.password
    );
    this.submitting.set(false);
    if (ok) {
      this.toast.show(`Welcome, ${this.fullName.trim().split(' ')[0]}! Your account is ready.`);
      this.router.navigate(['/']);
    }
  }
}
