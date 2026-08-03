import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import { ADMIN_CONTACT, AdminContactMsg } from '../../admin-data';
import { ToastService } from '../../../ui-state';

@Component({
  selector: 'app-admin-contact',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-contact.html',
  styleUrl: './admin-contact.css',
})
export class AdminContact {
  private toast = inject(ToastService);
  messages = signal<AdminContactMsg[]>(ADMIN_CONTACT);
  tab = signal<'all' | 'new' | 'read' | 'replied' | 'closed'>('all');
  selected = signal<AdminContactMsg | null>(null);
  replyText = '';

  filtered = computed(() => {
    const t = this.tab();
    return t === 'all' ? this.messages() : this.messages().filter((m) => m.status === t);
  });

  countStatus(s: string): number {
    return this.messages().filter((m) => m.status === s).length;
  }

  shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  select(m: AdminContactMsg) {
    this.selected.set(m);
    this.replyText = '';
    if (m.status === 'new') {
      this.messages.update((list) => list.map((x) => (x.id === m.id ? { ...x, status: 'read' } : x)));
      this.selected.set({ ...m, status: 'read' });
    }
  }

  markRead(m: AdminContactMsg) {
    this.messages.update((list) => list.map((x) => (x.id === m.id ? { ...x, status: 'read' } : x)));
    this.selected.set({ ...m, status: 'read' });
  }

  sendReply(m: AdminContactMsg) {
    if (!this.replyText.trim()) {
      this.toast.show('Please write a reply first.');
      return;
    }
    this.messages.update((list) => list.map((x) => (x.id === m.id ? { ...x, status: 'replied' } : x)));
    this.selected.set({ ...m, status: 'replied' });
    this.toast.show(`Reply sent to ${m.name}.`);
    this.replyText = '';
  }

  markClosed(m: AdminContactMsg) {
    this.messages.update((list) => list.map((x) => (x.id === m.id ? { ...x, status: 'closed' } : x)));
    this.selected.set({ ...m, status: 'closed' });
    this.toast.show('Ticket closed.');
  }
}
