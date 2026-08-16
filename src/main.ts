import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { App } from './app/app';
import { Home } from './pages/home/home';
import { About } from './pages/About/about';
import { Events } from './pages/events/events';
import { EventDetails } from './pages/event-details/event-details';
import { Timeline } from './pages/timeline/timeline';
import { Gallery } from './pages/gallery/gallery';
import { Community } from './pages/community/community';
import { Contact } from './pages/contact/contact';
import { NotFound } from './pages/not-found/not-found';
import { Register } from './pages/register/register';
import { Login } from './pages/login/login';
import { AdminLogin } from './admin/pages/admin-login/admin-login';
import { AdminLayout } from './admin/admin-layout';
import { AdminDashboard } from './admin/pages/dashboard/dashboard';
import { AdminEvents } from './admin/pages/admin-events/admin-events';
import { AdminGallery } from './admin/pages/admin-gallery/admin-gallery';
import { AdminStories } from './admin/pages/admin-stories/admin-stories';
import { AdminComments } from './admin/pages/admin-comments/admin-comments';
import { AdminUsers } from './admin/pages/admin-users/admin-users';
import { AdminContact } from './admin/pages/admin-contact/admin-contact';
import { AdminAnnouncements } from './admin/pages/admin-announcements/admin-announcements';
import { AdminHomepage } from './admin/pages/admin-homepage/admin-homepage';
import { AdminMedia } from './admin/pages/admin-media/admin-media';
import { AdminSettings } from './admin/pages/admin-settings/admin-settings';
import { AdminRoles } from './admin/pages/admin-roles/admin-roles';
import { AdminVoting } from './admin/pages/admin-voting/admin-voting';
import { AdminVotingResults } from './admin/pages/admin-voting-results/admin-voting-results';
import { Vote } from './pages/vote/vote';
import { adminGuard } from './admin/admin.guard';
import { memberGuard } from './services/member.guard';

bootstrapApplication(App, {
  providers: [
    provideRouter(
      [
        { path: '', component: Home },
        { path: 'about', component: About },
        { path: 'events', component: Events },
        { path: 'events/:id', component: EventDetails },
        { path: 'timeline', component: Timeline },
        { path: 'gallery', component: Gallery },
        { path: 'community', component: Community },
        { path: 'contact', component: Contact },
        { path: 'vote', component: Vote, canActivate: [memberGuard] },
        { path: 'register', component: Register },
        { path: 'login', component: Login },
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
        { path: 'admin/login', component: AdminLogin },
        { path: '**', component: NotFound },
      ],
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      })
    ),
  ],
});
