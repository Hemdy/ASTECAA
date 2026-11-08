import { Component, signal, inject, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_ITEMS } from '../../data';
import { MemberAuthService } from '../../services/member-auth';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  items = NAV_ITEMS;
  scrolled = signal(false);
  open = signal(false);
    auth = inject(MemberAuthService);


  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 24);
  }

 
  close() {
    this.open.set(false);
  }

  async signOut() {
    this.close();
    await this.auth.signOut();
  }
}
