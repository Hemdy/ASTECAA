import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { RevealDirective } from '../../reveal.directive';
import { Countdown } from '../../components/countdown/countdown';
import { EVENTS, MEMORIES, TIMELINE, MESSAGES, ORGANIZERS } from '../../data';
import { UiState } from '../../ui-state';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RevealDirective, Countdown, DecimalPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  ui = new UiState();
  featured = EVENTS[0];
  upcoming = EVENTS.slice(1, 5);
  latestMemories = MEMORIES.slice(0, 4);
  galleryPreview = MEMORIES.slice(4, 11);
  timelinePreview = TIMELINE.filter((_, i) => i % 2 === 0).slice(0, 4);
  messagesPreview = MESSAGES.slice(0, 3);
  organizers = ORGANIZERS;
  rotations = [-3, 2, -1.5, 3, -2.5, 1.8, -2, 2.5];

  dateMonthYear(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}
