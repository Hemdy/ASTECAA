import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  visible = signal(false);
  message = signal('');

  show(message: string): void {
    this.message.set(message);
    this.visible.set(true);
    setTimeout(() => this.visible.set(false), 3200);
  }
}
