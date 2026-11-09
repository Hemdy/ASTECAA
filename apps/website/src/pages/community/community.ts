import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../reveal.directive';
import { ToastService } from '@astec/ui';
import { CmsApiService } from '@astec/api-client';
import type { CmsCommunityMessage } from '@astec/types';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [FormsModule, RevealDirective],
  templateUrl: './community.html',
  styleUrl: './community.css',
})
export class Community implements OnInit {
  private cmsApi = inject(CmsApiService);
  private toast = inject(ToastService);

  filter = signal<'all' | 'pinned'>('all');
  messages = signal<CmsCommunityMessage[]>([]);
  loading = signal(false);
  submitting = signal(false);
  currentYear = new Date().getFullYear();

  form = { name: '', email: '', phone: '', graduationYear: '', message: '' };
  rotations = [-1.5, 2, -2, 1.5, -1, 2.5, -2.5, 1.2, -1.8, 2.2, -1.2, 1.8];
  rot(i: number) {
    return this.rotations[i % this.rotations.length];
  }

  ngOnInit() {
    void this.loadMessages();
  }

  async loadMessages() {
    this.loading.set(true);
    try {
      const data = await this.cmsApi.getCommunityMessages('community', 'approved');
      this.messages.set(data);
    } catch {
      this.messages.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  visible = () => {
    const f = this.filter();
    const list = this.messages();
    if (f === 'pinned') return list.filter((m) => m.pinned);
    return list;
  };

  canSubmit() {
    return (
      Boolean(this.form.name.trim()) &&
      Boolean(this.form.email.trim()) &&
      Boolean(this.form.phone.trim()) &&
      Boolean(this.form.graduationYear.trim()) &&
      Boolean(this.form.message.trim()) &&
      this.form.message.length <= 400
    );
  }

  async submit() {
    if (!this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    try {
      await this.cmsApi.postCommunityMessage({
        author: this.form.name.trim(),
        email: this.form.email.trim(),
        phone: this.form.phone.trim(),
        graduationYear: this.form.graduationYear.trim(),
        location: `Class of ${this.form.graduationYear.trim()}`,
        message: this.form.message.trim(),
        page: 'community',
      });
      this.form = { name: '', email: '', phone: '', graduationYear: '', message: '' };
      this.toast.show('Thank you! Your note has been submitted for moderation.');
      await this.loadMessages();
    } catch (err: any) {
      this.toast.show(err.message || 'Could not submit message. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  async like(id: string) {
    try {
      const res = await this.cmsApi.likeCommunityMessage(id);
      this.messages.update((list) =>
        list.map((m) => (m.id === id ? { ...m, likes: res.likes } : m))
      );
    } catch {
      this.messages.update((list) =>
        list.map((m) => (m.id === id ? { ...m, likes: (m.likes || 0) + 1 } : m))
      );
    }
  }

  onAvatarImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'images/empty/avatar-fallback.jpg';
  }
}
