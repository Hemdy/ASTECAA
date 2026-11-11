import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../reveal.directive';
import { ABOUT_MILESTONES, ORGANIZERS, MEMORIES } from '../../data';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
  loading = signal(false);
  milestones = ABOUT_MILESTONES;
  organizers = ORGANIZERS;
  heritagePhoto = MEMORIES[7].image;

  selectedEra = signal<'all' | 'early' | 'growth' | 'modern'>('all');

  filteredMilestones = computed(() => {
    const era = this.selectedEra();
    if (era === 'early') return this.milestones.filter((m) => +m.year <= 2005);
    if (era === 'growth') return this.milestones.filter((m) => +m.year > 2005 && +m.year <= 2018);
    if (era === 'modern') return this.milestones.filter((m) => +m.year > 2018);
    return this.milestones;
  });

  setEra(era: 'all' | 'early' | 'growth' | 'modern'): void {
    this.selectedEra.set(era);
  }

  onAvatarImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/empty/avatar-fallback.jpg';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/empty/image-fallback.jpg';
  }
}
