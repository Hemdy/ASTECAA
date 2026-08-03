import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../reveal.directive';
import { TIMELINE } from '../../data';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
})
export class Timeline {
  all = TIMELINE;
  era = signal('');

  eras = [
 
  { label: '1993–2003', from: 1993, to: 2003 }, // The Founding & Pioneer Decade
  { label: '2004–2014', from: 2004, to: 2014 }, // The Growth & Expansion Era
  { label: '2015–2026', from: 2015, to: 2026 }  // The Modern & Global Network Era

  ];

  filtered = signal(this.all);

  eraActive(e: { from: number; to: number }): boolean {
    const current = this.eras.find((x) => x.label === this.era());
    return current === e;
  }

  setEra(label: string) {
    this.era.set(label);
    if (!label) {
      this.filtered.set(this.all);
      return;
    }
    const e = this.eras.find((x) => x.label === label);
    if (e) this.filtered.set(this.all.filter((m) => m.year >= e.from && m.year <= e.to));
  }
}
