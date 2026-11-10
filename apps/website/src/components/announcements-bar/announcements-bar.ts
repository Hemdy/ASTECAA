import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import type { CmsAnnouncement } from '@astec/types';
import { RevealDirective } from '../../reveal.directive';

@Component({
  selector: 'app-announcements-bar',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './announcements-bar.html',
  styleUrl: './announcements-bar.css',
})
export class AnnouncementsBar implements OnInit, OnDestroy {
  announcements = input<CmsAnnouncement[]>([]);

  currentIndex = signal(0);
  isPaused = signal(false);

  private rotationTimer: ReturnType<typeof setInterval> | null = null;
  private touchStartX = 0;
  private mouseStartX = 0;
  private isMouseDown = false;

  activeIndex = computed(() => {
    const total = this.announcements().length;
    if (total === 0) return 0;
    return ((this.currentIndex() % total) + total) % total;
  });

  currentAnnouncement = computed(() => {
    const list = this.announcements();
    if (list.length === 0) return null;
    return list[this.activeIndex()];
  });

  constructor() {
    effect(() => {
      const total = this.announcements().length;
      if (total > 0 && this.currentIndex() >= total) {
        this.currentIndex.set(0);
      }
    });
  }

  ngOnInit(): void {
    this.startRotation();
  }

  ngOnDestroy(): void {
    this.stopRotation();
  }

  startRotation(): void {
    this.stopRotation();
    this.rotationTimer = setInterval(() => {
      if (!this.isPaused() && this.announcements().length > 1) {
        this.next();
      }
    }, 5000);
  }

  stopRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }

  next(): void {
    const total = this.announcements().length;
    if (total <= 1) return;
    this.currentIndex.update((i) => (i + 1) % total);
  }

  prev(): void {
    const total = this.announcements().length;
    if (total <= 1) return;
    this.currentIndex.update((i) => (i - 1 + total) % total);
  }

  goTo(index: number): void {
    this.currentIndex.set(index);
  }

  pause(): void {
    this.isPaused.set(true);
  }

  resume(): void {
    this.isPaused.set(false);
  }

  onTouchStart(e: TouchEvent): void {
    this.touchStartX = e.changedTouches[0].clientX;
  }

  onTouchEnd(e: TouchEvent): void {
    const deltaX = e.changedTouches[0].clientX - this.touchStartX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) this.next();
      else this.prev();
    }
  }

  onMouseDown(e: MouseEvent): void {
    this.mouseStartX = e.clientX;
    this.isMouseDown = true;
  }

  onMouseUp(e: MouseEvent): void {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;
    const deltaX = e.clientX - this.mouseStartX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) this.next();
      else this.prev();
    }
  }
}
