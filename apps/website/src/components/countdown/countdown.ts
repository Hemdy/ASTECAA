import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { UiState } from '../../ui-state';

@Component({
  selector: 'app-countdown',
  standalone: true,
  templateUrl: './countdown.html',
  styleUrl: './countdown.css',
})
export class Countdown implements OnInit, OnDestroy {
  @Input({ required: true }) target!: string;
  c = { days: 0, hours: 0, minutes: 0, seconds: 0, done: false };
  done = false;
  private ui = inject(UiState);
  private timer: any;

  ngOnInit() {
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  private tick() {
    this.c = this.ui.countdown(this.target);
    this.done = this.c.done;
  }

  pad(n: number) {
    return this.ui.pad(n);
  }
}
