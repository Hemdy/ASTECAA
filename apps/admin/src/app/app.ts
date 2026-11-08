import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from '@astec/ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Toast],
  template: `
    <router-outlet />
    <app-toast />
  `,
})
export class AdminApp {}
