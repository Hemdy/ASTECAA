import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../reveal.directive';
import { ToastService } from '../../ui-state';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, RevealDirective],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  private toast = inject(ToastService);
  form = { name: '', email: '', subject: '', message: '', captcha: false };

  canSubmit() {
    return (
      this.form.name.trim() &&
      this.form.email.trim() &&
      this.form.subject &&
      this.form.message.trim() &&
      this.form.captcha
    );
  }

  submit() {
    if (!this.canSubmit()) return;
    this.toast.show(`Thank you, ${this.form.name.split(' ')[0]}. Your letter is on its way.`);
    this.form = { name: '', email: '', subject: '', message: '', captcha: false };
  }
}
