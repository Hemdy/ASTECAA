import { Component } from '@angular/core';
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
  milestones = ABOUT_MILESTONES;
  organizers = ORGANIZERS;
  heritagePhoto = MEMORIES[7].image;


  onAvatarImageError(event: Event): void{

  const img = event.target as HTMLImageElement;
  img.src = '/images/empty/avatar-fallback.jpg';
  }

  onImageError(event: Event): void{

  const img = event.target as HTMLImageElement;
  img.src = '/images/empty/image-fallback.jpg';
  }



}
