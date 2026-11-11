import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../reveal.directive';
import { CustomSelect, SelectOption } from '../../components/custom-select/custom-select';
import { ToastService } from '@astec/ui';
import { CmsApiService } from '@astec/api-client';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, RouterLink, RevealDirective, CustomSelect],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  private cmsApi = inject(CmsApiService);
  private toast = inject(ToastService);
  loading = signal(false);
  submitting = signal(false);
  form = { name: '', email: '', subject: '', message: '', captcha: false };

  subjectOptions: SelectOption[] = [
    { label: 'General Inquiry', value: 'general', icon: 'ri-question-line' },
    { label: 'Share an Archival Memory', value: 'memory', icon: 'ri-history-line' },
    { label: 'Donate Photographs / Records', value: 'photo', icon: 'ri-image-line' },
    { label: 'Upcoming Event Question', value: 'event', icon: 'ri-calendar-event-line' },
    { label: 'Alumni Volunteering & Mentorship', value: 'volunteer', icon: 'ri-hand-heart-line' },
    { label: 'Press & Media Relations', value: 'press', icon: 'ri-newspaper-line' },
  ];

  canSubmit() {
    return (
      Boolean(this.form.name.trim()) &&
      Boolean(this.form.email.trim()) &&
      Boolean(this.form.subject) &&
      Boolean(this.form.message.trim()) &&
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
