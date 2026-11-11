import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MemberAuthService } from '../../services/member-auth';
import { ToastService } from '@astec/ui';

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
  route = inject(ActivatedRoute);
  toast = inject(ToastService);

  email = '';
  password = '';
  showPw = signal(false);
  submitting = signal(false);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.auth.ready().then(() => {
      this.loading.set(false);
      if (this.auth.isAuthenticated()) {
        this.router.navigate(['/']);
      }
    }).catch(() => {
      this.loading.set(false);
    });
  }

  togglePassword() {
    this.showPw.update(v => !v);
  }

  canSubmit(): boolean {
    return this.email.trim().length > 0 && this.email.includes('@') && this.password.length > 0;
  }

  async submit(e: Event) {
    e.preventDefault();
    if (!this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    this.errorMessage.set(null);
    this.auth.authError.set(null);

    const ok = await this.auth.signIn(this.email.trim(), this.password);
    this.submitting.set(false);

    if (ok) {
      this.toast.show(`Welcome back, ${this.auth.displayName().split(' ')[0]}!`);
      const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/';
      this.router.navigateByUrl(redirect);
    } else {
      this.errorMessage.set(
        this.auth.authError() || 'Unable to sign in. Please check your email and password.'
      );
    }
  }
}
