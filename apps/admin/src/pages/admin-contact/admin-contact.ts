import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '@astec/ui';
import { CmsApiService } from '@astec/api-client';
import type { ContactSubmission } from '@astec/types';

@Component({
  selector: 'app-admin-contact',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-contact.html',
  styleUrl: './admin-contact.css',
})
export class AdminContact implements OnInit {
  private cmsApi = inject(CmsApiService);
  private toast = inject(ToastService);

  messages = signal<ContactSubmission[]>([]);
  loading = signal(false);
  tab = signal<'all' | 'new' | 'read' | 'replied' | 'closed'>('all');
  selected = signal<ContactSubmission | null>(null);
  replyText = '';

  filtered = computed(() => {
    const t = this.tab();
    return t === 'all' ? this.messages() : this.messages().filter((m) => m.status === t);
  });

  ngOnInit() {
    void this.loadMessages();
  }

  async loadMessages() {
    this.loading.set(true);
    try {
      const data = await this.cmsApi.adminListContact();
      this.messages.set(data);
      if (this.selected()) {
        const updated = data.find((m) => m.id === this.selected()!.id);
        if (updated) this.selected.set(updated);
      }
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load contact messages');
    } finally {
      this.loading.set(false);
    }
  }

  countStatus(s: string): number {
    return this.messages().filter((m) => m.status === s).length;
  }

  shortDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async select(m: ContactSubmission) {
    this.selected.set(m);
    this.replyText = '';
    if (m.status === 'new') {
      try {
        const updated = await this.cmsApi.adminUpdateContactStatus(m.id, 'read');
        this.messages.update((list) => list.map((x) => (x.id === m.id ? updated : x)));
        this.selected.set(updated);
      } catch {}
    }
  }

  async markRead(m: ContactSubmission) {
    try {
      const updated = await this.cmsApi.adminUpdateContactStatus(m.id, 'read');
      this.messages.update((list) => list.map((x) => (x.id === m.id ? updated : x)));
      this.selected.set(updated);
      this.toast.show('Marked as read.');
    } catch (err: any) {
      this.toast.show(err.message || 'Action failed');
    }
  }

  async sendReply(m: ContactSubmission) {
    const text = this.replyText.trim();
    if (!text) {
      this.toast.show('Please write a reply first.');
      return;
    }
    try {
      const updated = await this.cmsApi.adminReplyContact(m.id, text);
      this.messages.update((list) => list.map((x) => (x.id === m.id ? updated : x)));
      this.selected.set(updated);
      this.toast.show(`Reply saved and sent to ${m.name}.`);
      this.replyText = '';
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to send reply');
    }
  }

  async markClosed(m: ContactSubmission) {
    try {
      const updated = await this.cmsApi.adminUpdateContactStatus(m.id, 'closed');
      this.messages.update((list) => list.map((x) => (x.id === m.id ? updated : x)));
      this.selected.set(updated);
      this.toast.show('Ticket closed.');
    } catch (err: any) {
      this.toast.show(err.message || 'Action failed');
    }
  }
}
