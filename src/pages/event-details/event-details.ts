import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../reveal.directive';
import { Countdown } from '../../components/countdown/countdown';
import { EVENTS, MESSAGES } from '../../data';
import { UiState, ToastService } from '../../ui-state';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [RouterLink, FormsModule, RevealDirective, Countdown, DecimalPipe],
  templateUrl: './event-details.html',
  styleUrl: './event-details.css',
})
export class EventDetails {
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  ui = new UiState();

  id = signal('');
  currentYear = new Date().getFullYear();
  ev = computed(() => EVENTS.find((e) => e.id === this.id()));
  related = computed(() => EVENTS.filter((e) => e.id !== this.id()).slice(0, 3));

  comments = signal(MESSAGES.slice(0, 3));
  commentText = '';
  registrationOpen = signal(false);
  registration = { name: '', email: '', phone: '', graduationYear: '' };

  constructor() {
    this.route.paramMap.subscribe((p) => this.id.set(p.get('id') ?? ''));
  }

  register() {
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

  submitRegistration() {
    if (!this.canRegister()) return;
    this.registrationOpen.set(false);
    this.toast.show('Your place is reserved. We will write to you closer to the day.');
  }

  share() {
    this.toast.show('A share link has been copied to your clipboard.');
  }

  addComment() {
    const text = this.commentText.trim();
    if (!text) return;
    const newComment = {
      id: `local-${Date.now()}`,
      author: 'You',
      location: 'Maple Hollow',
      avatar: '/images/reading-room.jpg',
      message: text,
      date: new Date().toISOString(),
      likes: 0,
    };
    this.comments.update((c) => [newComment, ...c]);
    this.commentText = '';
    this.toast.show('Your note has been added to the wall.');
  }

  like(id: string) {
    this.comments.update((list) =>
      list.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c))
    );
  }

    onAvatarImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.src = 'images/empty/avatar-fallback.jpg';
}

}
