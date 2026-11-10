import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from '@astec/ui';
import { AdminState } from '../admin-state';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Toast],
  template: `
    <router-outlet />
    <app-toast />
  `,
})
export class AdminApp {
  // Ensure global admin theme state initializes across unauthenticated routes (e.g. /admin/login).
  private readonly state = inject(AdminState);
}
