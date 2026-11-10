import { Component, signal, inject, HostListener, effect, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { NAV_ITEMS, NavItem } from '../../data';
import { MemberAuthService } from '../../services/member-auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnDestroy {
  private readonly router = inject(Router);
  readonly auth = inject(MemberAuthService);

  readonly items: NavItem[] = NAV_ITEMS;
  readonly scrolled = signal(false);
  readonly open = signal(false);

  private routerSub: Subscription;

  constructor() {
    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.close();
      });

    effect(() => {
      const isOpen = this.open();
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('nav-drawer-active', isOpen);
      }
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 20);
  }

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth > 1279 && this.open()) {
      this.close();
    }
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    if (this.open()) {
      this.close();
    }
  }

  toggle() {
    this.open.update((v) => !v);
  }

  close() {
    this.open.set(false);
  }

  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/images/empty/avatar-fallback.jpg';
  }

  async signOut() {
    this.close();
    await this.auth.signOut();
  }

  ngOnDestroy() {
    this.routerSub.unsubscribe();
    if (typeof document !== 'undefined') {
      document.body.classList.remove('nav-drawer-active');
    }
  }
}
