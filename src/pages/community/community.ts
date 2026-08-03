import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../reveal.directive';
import { MESSAGES, CommunityMessage } from '../../data';
import { ToastService } from '../../ui-state';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [FormsModule, RevealDirective],
  templateUrl: './community.html',
  styleUrl: './community.css',
})
export class Community {
  private toast = inject(ToastService);
  filter = signal<'all' | 'pinned'>('all');
  messages = signal<CommunityMessage[]>(MESSAGES);

  form = { author: '', location: '', message: '' };
  rotations = [-1.5, 2, -2, 1.5, -1, 2.5, -2.5, 1.2, -1.8, 2.2, -1.2, 1.8];
  rot(i: number) {
    return this.rotations[i % this.rotations.length];
  }

  visible = () => {
    const f = this.filter();
    const list = this.messages();
    if (f === 'pinned') return list.filter((m) => m.pinned);
    return list;
  };

  canSubmit() {
    return this.form.author.trim() && this.form.message.trim() && this.form.message.length <= 400;
  }

  submit() {
    if (!this.canSubmit()) return;
    const newMsg: CommunityMessage = {
      id: `local-${Date.now()}`,
      author: this.form.author.trim(),
      location: this.form.location.trim() || 'Somewhere near',
      avatar: '/images/reading-room.jpg',
      message: this.form.message.trim(),
      date: new Date().toISOString(),
      likes: 0,
    };
    this.messages.update((m) => [newMsg, ...m]);
    this.form = { author: '', location: '', message: '' };
    this.toast.show('Thank you — your note has been sent for review.');
  }

  like(id: string) {
    this.messages.update((list) =>
      list.map((m) => (m.id === id ? { ...m, likes: m.likes + 1, liked: true } : m))
    );
  }
}
