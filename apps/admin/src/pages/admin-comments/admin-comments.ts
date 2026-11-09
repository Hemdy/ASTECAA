import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import { ToastService } from '@astec/ui';
import { CmsApiService } from '@astec/api-client';
import { AdminAuthService } from '../../auth.service';

export interface AdminCommentView {
  id: string;
  author: string;
  email?: string | null;
  phone?: string | null;
  graduationYear?: string | null;
  location?: string | null;
  page: string;
  avatar: string;
  message: string;
  status: 'pending' | 'approved' | 'reported' | 'spam';
  likes: number;
  reports: number;
  replies?: Array<{
    id: string;
    messageId: string;
    userId?: string | null;
    author: string;
    email: string;
    avatar?: string | null;
    graduationYear?: string | null;
    message: string;
    createdAt: string;
  }>;
  createdAt: string;
}

@Component({
  selector: 'app-admin-comments',
  standalone: true,
  imports: [FormsModule, AdmModal],
  templateUrl: './admin-comments.html',
})
export class AdminComments implements OnInit {
  private cmsApi = inject(CmsApiService);
  private auth = inject(AdminAuthService);
  private toast = inject(ToastService);

  comments = signal<AdminCommentView[]>([]);
  loading = signal(false);
  tab = signal<'all' | 'pending' | 'approved' | 'reported' | 'spam'>('all');
  query = signal('');
  pageFilter = signal('');
  replyTarget = signal<AdminCommentView | null>(null);
  replyText = '';

  pages = ['community', 'home', 'events'];

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

  ngOnInit() {
    void this.loadComments();
  }

  async loadComments() {
    this.loading.set(true);
    try {
      const list = await this.cmsApi.adminListComments();
      this.comments.set(
        list.map((c: any) => ({
          id: c.id,
          author: c.author || 'Alumnus',
          email: c.email,
          phone: c.phone,
          graduationYear: c.graduationYear,
          location: c.location || (c.graduationYear ? `Class of ${c.graduationYear}` : 'Alumnus'),
          page: c.page || 'community',
          avatar: c.avatar || '/images/reading-room.jpg',
          message: c.message,
          status: c.status || 'pending',
          likes: c.likes || 0,
          reports: c.reports || 0,
          replies: c.replies || [],
          createdAt: c.createdAt || new Date().toISOString(),
        }))
      );
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load comments');
    } finally {
      this.loading.set(false);
    }
  }

  shortDate(iso?: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  async approve(id: string) {
    try {
      await this.cmsApi.updateCommentStatus(id, 'approved');
      this.comments.update((list) => list.map((c) => (c.id === id ? { ...c, status: 'approved' } : c)));
      this.toast.show('Comment approved and published.');
    } catch (err: any) {
      this.toast.show(err.message || 'Action failed');
    }
  }

  async markSpam(id: string) {
    try {
      await this.cmsApi.updateCommentStatus(id, 'spam');
      this.comments.update((list) => list.map((c) => (c.id === id ? { ...c, status: 'spam' } : c)));
      this.toast.show('Comment marked as spam.');
    } catch (err: any) {
      this.toast.show(err.message || 'Action failed');
    }
  }

  async deleteComment(id: string) {
    try {
      await this.cmsApi.deleteComment(id);
      this.comments.update((list) => list.filter((c) => c.id !== id));
      this.toast.show('Comment deleted.');
    } catch (err: any) {
      this.toast.show(err.message || 'Action failed');
    }
  }

  openReply(c: AdminCommentView) {
    this.replyTarget.set(c);
    this.replyText = '';
  }

  async sendReply() {
    const target = this.replyTarget();
    if (!target || !this.replyText.trim()) return;
    const profile = this.auth.profile();
    const adminName = profile?.full_name || 'ASTECAA Executive';
    const adminEmail = profile?.email || this.auth.userEmail() || 'admin@astecaa.org';

    try {
      await this.cmsApi.replyCommunityMessage(target.id, {
        author: adminName,
        email: adminEmail,
        message: this.replyText.trim(),
        graduationYear: 'Executive Team',
        avatar: '/images/ASTECAA.jpg',
      });
      this.toast.show('Reply saved and published to the community wall.');
      this.replyTarget.set(null);
      this.replyText = '';
      await this.loadComments();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to send reply');
    }
  }

  onAvatarImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/empty/avatar-fallback.jpg';
  }
}
