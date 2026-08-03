import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import { AdmConfirm } from '../../components/adm-confirm/adm-confirm';
import { ADMIN_STORIES, AdminStory } from '../../admin-data';
import { ToastService } from '../../../ui-state';

@Component({
  selector: 'app-admin-stories',
  standalone: true,
  imports: [FormsModule, DecimalPipe, AdmModal, AdmConfirm],
  templateUrl: './admin-stories.html',
})
export class AdminStories {
  private toast = inject(ToastService);
  stories = signal<AdminStory[]>(ADMIN_STORIES);
  tab = signal<'all' | 'published' | 'draft' | 'archived'>('all');
  query = signal('');
  catFilter = signal('');
  showModal = signal(false);
  editing = signal(false);
  deleteTarget = signal<AdminStory | null>(null);

  categories = [...new Set(ADMIN_STORIES.map((s) => s.category))];

  form: Partial<AdminStory> & { body?: string } = { title: '', excerpt: '', category: 'History', status: 'draft', body: '' };

  counts = computed(() => ({
    all: this.stories().length,
    published: this.stories().filter((s) => s.status === 'published').length,
    draft: this.stories().filter((s) => s.status === 'draft').length,
    archived: this.stories().filter((s) => s.status === 'archived').length,
  }));

  filtered = computed(() => {
    const t = this.tab();
    const q = this.query().toLowerCase();
    const c = this.catFilter();
    return this.stories().filter((s) => {
      const mt = t === 'all' || s.status === t;
      const mq = !q || s.title.toLowerCase().includes(q) || s.excerpt.toLowerCase().includes(q);
      const mc = !c || s.category === c;
      return mt && mq && mc;
    });
  });

  shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  truncate(s: string): string {
    return s.length > 60 ? s.slice(0, 60) + '…' : s;
  }

  exec(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
  }

  openCreate() {
    this.editing.set(false);
    this.form = { title: '', excerpt: '', category: 'History', status: 'draft', body: '' };
    this.showModal.set(true);
  }

  openEdit(s: AdminStory) {
    this.editing.set(true);
    this.form = { ...s, body: '<p>' + s.excerpt + '</p>' };
    this.showModal.set(true);
  }

  save(asDraft: boolean) {
    if (!this.form.title) {
      this.toast.show('Please give the story a title.');
      return;
    }
    const status = asDraft ? 'draft' : 'published';
    if (this.editing() && this.form.id) {
      this.stories.update((list) => list.map((s) => (s.id === this.form.id ? { ...s, ...this.form, status } as AdminStory : s)));
      this.toast.show(asDraft ? 'Draft saved.' : 'Story published.');
    } else {
      const newStory: AdminStory = {
        id: 's' + Date.now(),
        title: this.form.title || '',
        excerpt: this.form.excerpt || '',
        author: 'Marlene Whitfield',
        authorAvatar: '/images/avatar-marlene.jpg',
        category: this.form.category || 'History',
        status,
        date: new Date().toISOString().slice(0, 10),
        views: 0,
        comments: 0,
        cover: '/images/ASTECAA.jpg',
      };
      this.stories.update((list) => [newStory, ...list]);
      this.toast.show(asDraft ? 'Draft created.' : 'Story published.');
    }
    this.showModal.set(false);
  }

  toggleArchive(s: AdminStory) {
    this.stories.update((list) =>
      list.map((x) => (x.id === s.id ? { ...x, status: x.status === 'archived' ? 'draft' : 'archived' } : x))
    );
    this.toast.show(s.status === 'archived' ? 'Story restored.' : 'Story archived.');
  }

  askDelete(s: AdminStory) {
    this.deleteTarget.set(s);
  }

  confirmDelete() {
    const t = this.deleteTarget();
    if (t) {
      this.stories.update((list) => list.filter((s) => s.id !== t.id));
      this.toast.show('Story deleted.');
    }
    this.deleteTarget.set(null);
  }
}
