import { Component, signal, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { MemberAuthService } from "../../services/member-auth";
import { ToastService } from "@astec/ui";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: "./register.html",
  styleUrl: "./register.css",
})
export class Register {
  readonly auth = inject(MemberAuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  fullName = "";
  email = "";
  graduationSet = "";
  phone = "";
  password = "";
  confirmPassword = "";
  showPw = signal(false);
  submitting = signal(false);
  localError = signal<string | null>(null);

  constructor() {
    void this.auth.ready().then(async () => {
      if (this.auth.isAuthenticated()) {
        await this.router.navigate(["/"]);
      }
    });
  }

  canSubmit(): boolean {
    return (
      this.fullName.trim().length > 0 &&
      this.email.trim().includes("@") &&
      this.password.length >= 8 &&
      this.password === this.confirmPassword
    );
  }

  async submit(e: Event) {
    e.preventDefault();
    this.localError.set(null);

    if (this.password.length < 8) {
      this.localError.set("Password must be at least 8 characters long.");
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.localError.set("Passwords do not match.");
      return;
    }

    this.submitting.set(true);
    const ok = await this.auth.signUp(
      this.fullName.trim(),
      this.graduationSet.trim(),
      this.email.trim(),
      this.phone.trim() || null,
      this.password
    );
    this.submitting.set(false);

    if (ok) {
      this.toast.show(
        `Welcome to ASTECAA, ${this.fullName.trim().split(" ")[0]}!`
      );
      await this.router.navigate(["/"]);
    }
  }
}
