import {
  Component,
  signal,
  computed,
  inject,
  HostListener,
  effect,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ElementRef,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { NAV_ITEMS, NavItem } from '../../data';
import { MemberAuthService } from '../../services/member-auth';
import { VotingService } from '@astec/api-client';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly votingService = inject(VotingService);
  private readonly hostRef = inject(ElementRef<HTMLElement>);
  readonly auth = inject(MemberAuthService);

  readonly items: NavItem[] = NAV_ITEMS;
  readonly hasActiveElection = signal(false);

  readonly filteredNavItems = computed(() => {
    return this.items.filter((item) => {
      if (item.path === '/vote') {
        return this.hasActiveElection();
      }
      return true;
    });
  });

  readonly scrolled = signal(false);
  readonly open = signal(false);

  private routerSub: Subscription;
  private resizeObserver: ResizeObserver | null = null;

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

  ngOnInit(): void {
    void this.checkActiveElections();
  }

  ngAfterViewInit(): void {
    this.syncNavbarHeight();
    if (typeof window !== 'undefined' && typeof ResizeObserver !== 'undefined') {
      const navEl = this.hostRef.nativeElement.querySelector('.nav');
      if (navEl) {
        this.resizeObserver = new ResizeObserver(() => {
          this.syncNavbarHeight();
        });
        this.resizeObserver.observe(navEl);
      }
    }
  }

  private syncNavbarHeight(): void {
    if (typeof document === 'undefined' || this.open()) {
      return;
    }
    const navEl = this.hostRef.nativeElement.querySelector('.nav') as HTMLElement | null;
    if (!navEl) {
      return;
    }
    const height = Math.round(navEl.getBoundingClientRect().height);
    if (height > 0) {
      document.documentElement.style.setProperty('--navbar-height', `${height}px`);
    }
  }

  async checkActiveElections(): Promise<void> {
    try {
      const elections = await this.votingService.getActiveElections();
      const now = new Date();
      const active = (elections || []).some((e) => {
        const start = new Date(e.start_date);
        const end = new Date(e.end_date);
        return start <= now && end >= now;
      });
      this.hasActiveElection.set(active);
    } catch {
      this.hasActiveElection.set(false);
    }
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
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (typeof document !== 'undefined') {
      document.body.classList.remove('nav-drawer-active');
    }
  }
}
