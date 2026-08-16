import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../ui-state';
import { NAV_ITEMS } from '../../data';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {

  socials = [
  {
    name: 'Facebook',
    icon: 'icons/facebook.png',
    url: 'https://www.facebook.com/groups/111173245611375/'
  },
  {
    name: 'Instagram',
    icon: 'icons/instagram.png',
    url: 'https://www.instagram.com/astec_alumni?igsh=MWc5ZWRqOGJlc2lyZg=='
  },
  {
    name: 'Twitter',
    icon: 'icons/twitter.png',
    url: 'https://x.com/astecaa'
  }
];


  private toast = inject(ToastService);
  items = NAV_ITEMS;
  email = '';
  name = '';

  subscribe() {
    if (!this.email) return;
    this.toast.show(`Welcome to the dispatch. We will write to ${this.email}.`);
    this.email = '';
    this.name = '';
  }
}
