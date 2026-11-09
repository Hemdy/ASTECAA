import { Component, signal, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../reveal.directive';
import { ToastService } from '@astec/ui';
import { CmsApiService } from '@astec/api-client';
import { MemberAuthService } from '../../services/member-auth';
import type { CmsCommunityMessage, CommunityReply, CmsAnnouncement } from '@astec/types';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [FormsModule, RevealDirective, DatePipe, RouterLink],
  templateUrl: './community.html',
  styleUrl: './community.css',
})
export class Community implements OnInit {
  private cmsApi = inject(CmsApiService);
  private toast = inject(ToastService);
  readonly auth = inject(MemberAuthService);

  filter = signal<'all' | 'pinned'>('all');
  messages = signal<CmsCommunityMessage[]>([]);
  announcements = signal<CmsAnnouncement[]>([]);
  loading = signal(false);
  submitting = signal(false);
  currentYear = new Date().getFullYear();

  // Track open reply threads and reply inputs per note
  openReplies = signal<Record<string, boolean>>({});
  replyInputs = signal<Record<string, string>>({});
  replySubmitting = signal<Record<string, boolean>>({});

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
      const email = this.auth.profile()?.email;
      const [data, ann] = await Promise.all([
        this.cmsApi.getCommunityMessages('community', 'approved', email),
        this.cmsApi.getAnnouncements().catch(() => []),
      ]);
      this.messages.set(data);
      if (ann && ann.length > 0) {
        this.announcements.set(ann.filter((a) => a.status === 'published'));
      }
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

  canSubmit(): boolean {
    const msgOk = Boolean(this.form.message.trim()) && this.form.message.length <= 400;
    if (this.auth.isAuthenticated() && this.auth.profile()) {
      return msgOk;
    }
    return (
      msgOk &&
      Boolean(this.form.name.trim()) &&
      Boolean(this.form.email.trim()) &&
      Boolean(this.form.phone.trim()) &&
      Boolean(this.form.graduationYear.trim())
    );
  }

  async submit() {
    if (!this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    try {
      const profile = this.auth.profile();
      if (profile) {
        await this.cmsApi.postCommunityMessage({
          author: profile.full_name,
          email: profile.email,
          phone: profile.phone || '',
          graduationYear: profile.graduation_set || '',
          location: profile.graduation_set ? `Class of ${profile.graduation_set}` : 'Global Alumni',
          avatar: profile.avatar_url || '',
          message: this.form.message.trim(),
          page: 'community',
          userId: profile.id,
        });
      } else {
        await this.cmsApi.postCommunityMessage({
          author: this.form.name.trim(),
          email: this.form.email.trim(),
          phone: this.form.phone.trim(),
          graduationYear: this.form.graduationYear.trim(),
          location: `Class of ${this.form.graduationYear.trim()}`,
          message: this.form.message.trim(),
          page: 'community',
        });
      }
      this.form = { name: '', email: '', phone: '', graduationYear: '', message: '' };
      this.toast.show('Thank you! Your note is now pinned to the wall.');
      await this.loadMessages();
    } catch (err: any) {
      this.toast.show(err.message || 'Could not submit message. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  async react(msg: CmsCommunityMessage, reactionType: string) {
    const profile = this.auth.profile();
    if (!profile) {
      // Fallback for non-authenticated guests: increments like count
      await this.like(msg.id);
      return;
    }

    try {
      const res = await this.cmsApi.reactCommunityMessage(msg.id, {
        reaction: reactionType,
        userEmail: profile.email,
        userId: profile.id,
      });

      this.messages.update((list) =>
        list.map((m) => {
          if (m.id !== msg.id) return m;
          const currentReactions = { ...(m.reactions || {}) };
          currentReactions[reactionType] = res.reactions[reactionType] || 0;
          let userRxns = m.userReactions ? [...m.userReactions] : [];
          if (res.active) {
            if (!userRxns.includes(reactionType)) userRxns.push(reactionType);
          } else {
            userRxns = userRxns.filter((r) => r !== reactionType);
          }
          return {
            ...m,
            likes: reactionType === 'heart' ? (res.reactions['heart'] || 0) : m.likes,
            reactions: res.reactions,
            userReactions: userRxns,
          };
        }),
      );
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to update reaction.');
    }
  }

  hasReacted(msg: CmsCommunityMessage, reaction: string): boolean {
    return Boolean(msg.userReactions?.includes(reaction));
  }

  toggleReplies(messageId: string) {
    this.openReplies.update((curr) => ({
      ...curr,
      [messageId]: !curr[messageId],
    }));
  }

  isRepliesOpen(messageId: string): boolean {
    return Boolean(this.openReplies()[messageId]);
  }

  getReplyInput(messageId: string): string {
    return this.replyInputs()[messageId] || '';
  }

  setReplyInput(messageId: string, value: string) {
    this.replyInputs.update((curr) => ({
      ...curr,
      [messageId]: value,
    }));
  }

  async submitReply(msg: CmsCommunityMessage) {
    const text = this.getReplyInput(msg.id).trim();
    if (!text || this.replySubmitting()[msg.id]) return;

    const profile = this.auth.profile();
    if (!profile) {
      this.toast.show('Please sign in to reply to this note.');
      return;
    }

    this.replySubmitting.update((curr) => ({ ...curr, [msg.id]: true }));
    try {
      const newReply = await this.cmsApi.replyCommunityMessage(msg.id, {
        author: profile.full_name,
        email: profile.email,
        message: text,
        graduationYear: profile.graduation_set || '',
        avatar: profile.avatar_url || '',
        userId: profile.id,
      });

      this.messages.update((list) =>
        list.map((m) => {
          if (m.id !== msg.id) return m;
          const currentReplies = m.replies ? [...m.replies] : [];
          return {
            ...m,
            replies: [...currentReplies, newReply],
          };
        }),
      );

      this.setReplyInput(msg.id, '');
      this.toast.show('Reply posted.');
    } catch (err: any) {
      this.toast.show(err.message || 'Could not post reply.');
    } finally {
      this.replySubmitting.update((curr) => ({ ...curr, [msg.id]: false }));
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
    img.src = '/images/empty/avatar-fallback.jpg';
  }
}
