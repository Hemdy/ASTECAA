import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import { ToastService } from '../../../ui-state';

interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  status: 'published' | 'scheduled' | 'draft';
  pinned: boolean;
  channel: 'email' | 'push' | 'site';
}

@Component({
  selector: 'app-admin-announcements',
  standalone: true,
  imports: [FormsModule, AdmModal],
  templateUrl: './admin-announcements.html',
})
export class AdminAnnouncements {
  private toast = inject(ToastService);

  items = signal<Announcement[]>([
    {
      id: 'an1',
      title: 'ASTECAA Annual Alumni Reunion 2026 registration is open',
      body:
        'Registration for the ASTECAA Annual Alumni Reunion 2026 is now open. Join fellow alumni for a weekend of reconnection, networking, recognition, celebration, and fellowship at the ASTEC Campus on December 19–20, 2026.',
      date: '2026-09-01',
      status: 'published',
      pinned: true,
      channel: 'email',
    },

    {
      id: 'an2',
      title: 'ASTECAA Career & Networking Forum registration',
      body:
        'The ASTECAA Career & Networking Forum takes place on September 26, 2026, at the ASTEC Alumni Hall. Alumni professionals, entrepreneurs, young alumni, and recent graduates are invited to connect, learn, and build meaningful professional relationships.',
      date: '2026-09-10',
      status: 'published',
      pinned: false,
      channel: 'site',
    },

    {
      id: 'an3',
      title: 'Reminder: ASTECAA Annual General Meeting 2026',
      body:
        'A reminder to all ASTECAA members that the Annual General Meeting will hold on November 28, 2026, at the ASTECAA Secretariat. Members will receive updates on association activities, projects, finances, welfare initiatives, and priorities for the coming year.',
      date: '2026-11-20',
      status: 'scheduled',
      pinned: false,
      channel: 'push',
    },

    {
      id: 'an4',
      title: 'ASTECAA Legacy & Fundraising Dinner 2027',
      body:
        'Save the date for the ASTECAA Legacy & Fundraising Dinner on February 27, 2027. The evening will celebrate the achievements of our alumni community while raising support for approved ASTECAA projects and initiatives.',
      date: '2027-02-01',
      status: 'scheduled',
      pinned: false,
      channel: 'email',
    },

    {
      id: 'an5',
      title: 'Draft: ASTECAA Alumni Sports & Family Day',
      body:
        'A draft announcement inviting alumni and their families to the ASTECAA Alumni Sports & Family Day on April 17, 2027. The programme will include football, family games, friendly competitions, awards, and fellowship.',
      date: '',
      status: 'draft',
      pinned: false,
      channel: 'site',
    },

    {
      id: 'an6',
      title: 'Draft: ASTECAA Mentorship & Scholarship Day',
      body:
        'A draft announcement for the ASTECAA Mentorship & Scholarship Day on June 12, 2027. The programme will connect students and young graduates with alumni professionals while supporting scholarship and educational opportunities.',
      date: '',
      status: 'draft',
      pinned: false,
      channel: 'site',
    },
  ]);

  showModal = signal(false);
  editing = signal(false);

  form: Partial<Announcement> = {
    title: '',
    body: '',
    date: '',
    channel: 'site',
    pinned: false,
    status: 'draft',
  };

  shortDate(iso: string): string {
    if (!iso) return 'Not scheduled';

    return new Date(iso).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  channelLabel(c: string): string {
    return c === 'email'
      ? 'Email'
      : c === 'push'
        ? 'Push'
        : 'Website';
  }

  openCreate() {
    this.editing.set(false);

    this.form = {
      title: '',
      body: '',
      date: '',
      channel: 'site',
      pinned: false,
      status: 'draft',
    };

    this.showModal.set(true);
  }

  edit(a: Announcement) {
    this.editing.set(true);
    this.form = { ...a };
    this.showModal.set(true);
  }

  save(asDraft: boolean) {
    if (!this.form.title) {
      this.toast.show('Please give the announcement a title.');
      return;
    }

    const status = asDraft
      ? 'draft'
      : this.form.date
        ? 'scheduled'
        : 'published';

    if (this.editing() && this.form.id) {
      this.items.update((list) =>
        list.map((a) =>
          a.id === this.form.id
            ? {
                ...a,
                ...this.form,
                status,
              } as Announcement
            : a
        )
      );

      this.toast.show('Announcement updated.');
    } else {
      const newA: Announcement = {
        id: 'an' + Date.now(),
        title: this.form.title || '',
        body: this.form.body || '',
        date: this.form.date || '',
        status,
        pinned: !!this.form.pinned,
        channel:
          (this.form.channel as Announcement['channel']) || 'site',
      };

      this.items.update((list) => [newA, ...list]);

      this.toast.show(
        asDraft
          ? 'Draft saved.'
          : status === 'scheduled'
            ? 'Announcement scheduled.'
            : 'Announcement published.'
      );
    }

    this.showModal.set(false);
  }

  togglePin(a: Announcement) {
    this.items.update((list) =>
      list.map((x) =>
        x.id === a.id
          ? {
              ...x,
              pinned: !x.pinned,
            }
          : x
      )
    );

    this.toast.show(a.pinned ? 'Unpinned.' : 'Pinned to top.');
  }

  remove(a: Announcement) {
    this.items.update((list) =>
      list.filter((x) => x.id !== a.id)
    );

    this.toast.show('Announcement deleted.');
  }
}