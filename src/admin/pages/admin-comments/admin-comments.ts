import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import { ADMIN_COMMENTS, AdminComment } from '../../admin-data';
import { ToastService } from '../../../ui-state';

@Component({
  selector: 'app-admin-comments',
  standalone: true,
  imports: [FormsModule, AdmModal],
  templateUrl: './admin-comments.html',
})
export class AdminComments {
  private toast = inject(ToastService);
  comments = signal<AdminComment[]>(ADMIN_COMMENTS);
  tab = signal<'all' | 'pending' | 'approved' | 'reported' | 'spam'>('all');
  query = signal('');
  pageFilter = signal('');
  replyTarget = signal<AdminComment | null>(null);
  replyText = '';

  pages = [...new Set(ADMIN_COMMENTS.map((c) => c.page))];

  counts = computed(() => {
    const all = this.comments();
    return {
      all: all.length,
      pending: all.filter((c) => c.status === 'pending').length,
      approved: all.filter((c) => c.status === 'approved').length,
      reported: all.filter((c) => c.status === 'reported').length,
      spam: all.filter((c) => c.status === 'spam').length,
    };
  });

  filtered = computed(() => {
    const t = this.tab();
    const q = this.query().toLowerCase();
    const p = this.pageFilter();
    return this.comments().filter((c) => {
      const mt = t === 'all' || c.status === t;
      const mq = !q || c.author.toLowerCase().includes(q) || c.message.toLowerCase().includes(q);
      const mp = !p || c.page === p;
      return mt && mq && mp;
    });
  });

  shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  approve(id: string) {
    this.comments.update((list) => list.map((c) => (c.id === id ? { ...c, status: 'approved' } : c)));
    this.toast.show('Comment approved and published.');
  }

  markSpam(id: string) {
    this.comments.update((list) => list.map((c) => (c.id === id ? { ...c, status: 'spam' } : c)));
    this.toast.show('Comment marked as spam.');
  }

  deleteComment(id: string) {
    this.comments.update((list) => list.filter((c) => c.id !== id));
    this.toast.show('Comment deleted.');
  }

  openReply(c: AdminComment) {
    this.replyTarget.set(c);
    this.replyText = '';
  }

  sendReply() {
    if (!this.replyText.trim()) return;
    this.toast.show('Reply posted.');
    this.replyTarget.set(null);
    this.replyText = '';
  }
}
