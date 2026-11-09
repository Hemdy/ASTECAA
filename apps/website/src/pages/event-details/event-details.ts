
import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../reveal.directive';
import { Countdown } from '../../components/countdown/countdown';
import { MESSAGES } from '../../data';
import { ToastService } from '@astec/ui';
import { UiState } from '../../ui-state';
import { EventsApiService } from '@astec/api-client';
import { MemberAuthService } from '../../services/member-auth';
import type { PublicEvent } from '@astec/types';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    RevealDirective,
    Countdown,
    DecimalPipe
  ],
  templateUrl: './event-details.html',
  styleUrl: './event-details.css',
})
export class EventDetails {
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private eventsApi = inject(EventsApiService);
  private auth = inject(MemberAuthService);

  ui = new UiState();

  id = signal('');
  ev = signal<PublicEvent | null>(null);
  related = signal<PublicEvent[]>([]);
  loading = signal(true);
  loadError = signal<string | null>(null);
  currentYear = new Date().getFullYear();

  comments = signal(MESSAGES.slice(0, 3));

  // Comment form
  commentFName = '';
  commentLName = '';
  commentEmail = '';
  commentText = '';

  registrationOpen = signal(false);

  registration = {
    name: '',
    email: '',
    phone: '',
    graduationYear: '',
  };

  constructor() {
    this.route.paramMap.subscribe((p) => {
      const id = p.get('id') ?? '';
      this.id.set(id);
      void this.loadEvent(id);
    });
  }

  private async loadEvent(id: string): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    this.ev.set(null);
    try {
      const [event, events] = await Promise.all([
        this.eventsApi.getPublic(id),
        this.eventsApi.listPublic(),
      ]);
      if (id !== this.id()) {
        return;
      }
      this.ev.set(event);
      this.related.set(events.filter((event) => event.id !== id).slice(0, 3));
    } catch (error) {
      this.loadError.set(error instanceof Error ? error.message : 'Event could not be loaded.');
    } finally {
      if (id === this.id()) {
        this.loading.set(false);
      }
    }
  }

  register() {
    const profile = this.auth.profile();
    if (profile) {
      if (!this.registration.name && profile.full_name) this.registration.name = profile.full_name;
      if (!this.registration.email && profile.email) this.registration.email = profile.email;
      if (!this.registration.phone && profile.phone) this.registration.phone = profile.phone;
      if (!this.registration.graduationYear && profile.graduation_set) {
        this.registration.graduationYear = profile.graduation_set;
      }
    }
    this.registrationOpen.set(true);
  }

  canRegister(): boolean {
    return (
      this.registration.name.trim().length > 0 &&
      this.registration.email.trim().length > 0 &&
      this.registration.phone.trim().length > 0 &&
      this.registration.graduationYear.trim().length > 0
    );
  }

  async submitRegistration() {
    if (!this.canRegister()) return;
    const event = this.ev();
    if (!event) return;

    try {
      await this.eventsApi.register(event.id, {
        name: this.registration.name.trim(),
        email: this.registration.email.trim(),
        phone: this.registration.phone.trim(),
        graduationYear: this.registration.graduationYear.trim(),
        userId: this.auth.profile()?.id,
      });

      this.registrationOpen.set(false);
      this.toast.show(
        'Your place is reserved. We will write to you closer to the day.'
      );
      this.registration = {
        name: '',
        email: '',
        phone: '',
        graduationYear: '',
      };
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to submit registration.');
    }
  }

  share() {
    this.toast.show(
      'A share link has been copied to your clipboard.'
    );
  }

  addComment() {
    const name = this.commentFName.trim() + ' ' + this.commentLName.trim();
    const email = this.commentEmail.trim();
    const text = this.commentText.trim();

    if (!name || !email || !text) {
      return;
    }

    const newComment = {
      id: `local-${Date.now()}`,
      author: name,
      email: email,
      location: 'Maple Hollow',
      avatar: '/images/reading-room.jpg',
      message: text,
      date: new Date().toISOString(),
      likes: 0,
    };

    this.comments.update((comments) => [
      newComment,
      ...comments
    ]);

    // Clear form after posting
    this.commentFName = '';
    this.commentLName = '';
    this.commentEmail = '';
    this.commentText = '';

    this.toast.show(
      'Your note has been added to the wall.'
    );
  }

  like(id: string) {
    this.comments.update((list) =>
      list.map((c) =>
        c.id === id
          ? { ...c, likes: c.likes + 1 }
          : c
      )
    );
  }

  onAvatarImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/empty/avatar-fallback.jpg';
  }
}
