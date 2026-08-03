import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { Toast } from './components/toast/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, Toast],
  template: `
    <app-navbar />
    <main class="app-main">
      <router-outlet />
    </main>
    <app-footer />
    <app-toast />
  `,
  styles: [
    `
      .app-main {
        min-height: 70vh;
      }
    `,
  ],
})
export class App {}
