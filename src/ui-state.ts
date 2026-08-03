import { Injectable, signal } from '@angular/core';
import { EventItem } from './data';

@Injectable({ providedIn: 'root' })
export class UiState {
  /** Returns a count-up display string for a date countdown. */
  countdown(targetISO: string): { days: number; hours: number; minutes: number; seconds: number; done: boolean } {
    const target = new Date(targetISO).getTime();
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      done: false,
    };
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  monthDay(iso: string): { month: string; day: string } {
    const d = new Date(iso);
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      day: d.toLocaleDateString('en-US', { day: 'numeric' }),
    };
  }

  percentageOf(ev: EventItem): number {
    return Math.min(100, Math.round((ev.registered / ev.capacity) * 100));
  }

  pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  visible = signal(false);
  message = signal('');

  show(msg: string) {
    this.message.set(msg);
    this.visible.set(true);
    setTimeout(() => this.visible.set(false), 3200);
  }
}
