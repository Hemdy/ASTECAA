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
  ev = computed(() => EVENTS.find((e) => e.id === this.id()));
  related = computed(() => EVENTS.filter((e) => e.id !== this.id()).slice(0, 3));

  comments = signal(MESSAGES.slice(0, 3));
  commentText = '';

  constructor() {
    this.route.paramMap.subscribe((p) => this.id.set(p.get('id') ?? ''));
  }

  register() {
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
}
