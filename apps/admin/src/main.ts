import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AdminApp } from './app/app';
import { AdminLayout } from './admin-layout';
import { adminGuard } from './admin.guard';
import { AdminLogin } from './pages/admin-login/admin-login';
import { AdminDashboard } from './pages/dashboard/dashboard';
import { AdminEvents } from './pages/admin-events/admin-events';
import { AdminGallery } from './pages/admin-gallery/admin-gallery';
import { AdminStories } from './pages/admin-stories/admin-stories';
import { AdminComments } from './pages/admin-comments/admin-comments';
import { AdminUsers } from './pages/admin-users/admin-users';
import { AdminContact } from './pages/admin-contact/admin-contact';
import { AdminAnnouncements } from './pages/admin-announcements/admin-announcements';
import { AdminHomepage } from './pages/admin-homepage/admin-homepage';
import { AdminMedia } from './pages/admin-media/admin-media';
import { AdminSettings } from './pages/admin-settings/admin-settings';
import { AdminRoles } from './pages/admin-roles/admin-roles';
import { AdminVoting } from './pages/admin-voting/admin-voting';
import { AdminVotingResults } from './pages/admin-voting-results/admin-voting-results';

bootstrapApplication(AdminApp, {
  providers: [
    provideRouter([
      { path: '', redirectTo: 'admin/dashboard', pathMatch: 'full' },
      { path: 'login', redirectTo: 'admin/login', pathMatch: 'full' },
      { path: 'dashboard', redirectTo: 'admin/dashboard', pathMatch: 'full' },
      { path: 'admin/login', component: AdminLogin },
      {
        path: 'admin',
        canActivate: [adminGuard],
        component: AdminLayout,
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: AdminDashboard },
          { path: 'events', component: AdminEvents },
          { path: 'gallery', component: AdminGallery },
          { path: 'stories', component: AdminStories },
          { path: 'comments', component: AdminComments },
          { path: 'announcements', component: AdminAnnouncements },
          { path: 'users', component: AdminUsers },
          { path: 'registrations', component: AdminUsers },
          { path: 'contact', component: AdminContact },
          { path: 'homepage', component: AdminHomepage },
          { path: 'media', component: AdminMedia },
          { path: 'settings', component: AdminSettings },
          { path: 'roles', component: AdminRoles },
          { path: 'voting', component: AdminVoting },
          { path: 'voting-results', component: AdminVotingResults },
        ],
      },
      { path: '**', redirectTo: 'admin/dashboard' },
    ]),
  ],
}).catch((error: unknown) => {
  console.error('Failed to start the ASTECAA admin application.', error);
});
