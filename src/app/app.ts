import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { Navbar } from '../components/navbar/navbar';
import { Footer } from '../components/footer/footer';
import { Toast } from '../components/toast/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  isAdmin = false;

  constructor(router: Router) {
    router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        const nav = e as NavigationEnd;
        this.isAdmin = nav.urlAfterRedirects.startsWith('/admin');
      });
  }
}
