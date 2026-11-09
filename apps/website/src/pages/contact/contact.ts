import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../reveal.directive';
import { ToastService } from '@astec/ui';
import { CmsApiService } from '@astec/api-client';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, RevealDirective],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  private cmsApi = inject(CmsApiService);
  private toast = inject(ToastService);
  submitting = signal(false);
  form = { name: '', email: '', subject: '', message: '', captcha: false };

  canSubmit() {
    return (
      this.form.name.trim() &&
      this.form.email.trim() &&
      this.form.subject &&
      this.form.message.trim() &&
      this.form.captcha &&
      !this.submitting()
    );
  }

  async submit() {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    try {
      await this.cmsApi.submitContact({
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        subject: this.form.subject,
        message: this.form.message.trim(),
      });
      this.toast.show(`Thank you, ${this.form.name.split(' ')[0]}. Your message has been received.`);
      this.form = { name: '', email: '', subject: '', message: '', captcha: false };
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to submit message. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
