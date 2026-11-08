import { Routes } from '@angular/router';
import { Home } from '../pages/home/home';
import { About } from '../pages/About/about';
import { Events } from '../pages/events/events';
import { EventDetails } from '../pages/event-details/event-details';
import { Timeline } from '../pages/timeline/timeline';
import { Gallery } from '../pages/gallery/gallery';
import { Community } from '../pages/community/community';
import { Contact } from '../pages/contact/contact';
import { NotFound } from '../pages/not-found/not-found';
import { Register } from '../pages/register/register';
import { Login } from '../pages/login/login';
import { Vote } from '../pages/vote/vote';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'about', component: About },
  { path: 'events', component: Events },
  { path: 'events/:id', component: EventDetails },
  { path: 'timeline', component: Timeline },
  { path: 'gallery', component: Gallery },
  { path: 'community', component: Community },
  { path: 'contact', component: Contact },
  { path: 'vote', component: Vote },
  { path: 'register', component: Register },
  { path: 'login', component: Login },
  { path: '**', component: NotFound },
];
