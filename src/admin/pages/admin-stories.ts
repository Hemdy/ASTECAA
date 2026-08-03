import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AdmModal } from '../components/adm-modal';
import { AdmConfirm } from '../components/adm-confirm';
import { ADMIN_STORIES, AdminStory } from '../admin-data';
import { ToastService } from '../../ui-state';

@Component({
  selector: 'app-admin-stories',
  standalone: true,
  imports: [FormsModule, DecimalPipe, AdmModal, AdmConfirm],
  template: `
    <div class="adm-toolbar">
      <div>
        <div class="adm-section-title">Community Stories</div>
        <div class="adm-section-sub">Write and manage the stories that give the archive its voice.</div>
      </div>
      <button class="adm-btn adm-btn-primary" style="margin-left: auto" (click)="openCreate()">+ Write Story</button>
    </div>

    <div class="adm-tabs">
      <button class="adm-tab" [class.active]="tab() === 'all'" (click)="tab.set('all')">All <span class="adm-badge adm-badge-muted" style="margin-left: 6px">{{ counts().all }}</span></button>
      <button class="adm-tab" [class.active]="tab() === 'published'" (click)="tab.set('published')">Published <span class="adm-badge adm-badge-success" style="margin-left: 6px">{{ counts().published }}</span></button>
      <button class="adm-tab" [class.active]="tab() === 'draft'" (click)="tab.set('draft')">Drafts <span class="adm-badge adm-badge-warning" style="margin-left: 6px">{{ counts().draft }}</span></button>
      <button class="adm-tab" [class.active]="tab() === 'archived'" (click)="tab.set('archived')">Archived <span class="adm-badge adm-badge-muted" style="margin-left: 6px">{{ counts().archived }}</span></button>
    </div>

    <div class="adm-card adm-card-pad" style="margin-bottom: 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end">
      <div class="adm-field" style="margin: 0; flex: 1; min-width: 200px">
        <label class="adm-field-label">Search</label>
        <input class="adm-input" [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Search stories…" />
      </div>
      <div class="adm-field" style="margin: 0; min-width: 150px">
        <label class="adm-field-label">Category</label>
        <select class="adm-select" [ngModel]="catFilter()" (ngModelChange)="catFilter.set($event)">
          <option value="">All</option>
          @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
        </select>
      </div>
    </div>

    <div class="adm-card">
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Story</th>
              <th>Author</th>
              <th>Category</th>
              <th>Views</th>
              <th>Comments</th>
              <th>Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (s of filtered(); track s.id) {
              <tr>
                <td>
                  <div class="adm-cell-user">
                    <img class="adm-thumb" [src]="s.cover" [alt]="s.title" style="width: 56px; height: 36px" />
                    <div>
                      <div class="adm-cell-user-name">{{ s.title }}</div>
                      <div class="adm-cell-user-sub">{{ truncate(s.excerpt) }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="adm-cell-user">
                    <img class="adm-avatar adm-avatar-sm" [src]="s.authorAvatar" [alt]="s.author" />
                    <span>{{ s.author }}</span>
                  </div>
                </td>
                <td><span class="adm-badge adm-badge-gold">{{ s.category }}</span></td>
                <td>{{ s.views | number }}</td>
                <td>{{ s.comments }}</td>
                <td>{{ shortDate(s.date) }}</td>
                <td><span class="adm-badge" [class.adm-badge-success]="s.status === 'published'" [class.adm-badge-warning]="s.status === 'draft'" [class.adm-badge-muted]="s.status === 'archived'">{{ s.status }}</span></td>
                <td>
                  <div class="adm-table-actions">
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="openEdit(s)" title="Edit">✎</button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="toggleArchive(s)" title="Archive/Restore">{{ s.status === 'archived' ? '↑' : '🗄' }}</button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="askDelete(s)" title="Delete">🗑</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (showModal()) {
      <app-adm-modal [title]="editing() ? 'Edit Story' : 'Write a New Story'" size="lg" (close)="showModal.set(false)">
        <div style="display: grid; gap: 16px">
          <div class="adm-field">
            <label class="adm-field-label">Title</label>
            <input class="adm-input" [(ngModel)]="form.title" placeholder="A title that invites reading…" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="adm-field">
              <label class="adm-field-label">Category</label>
              <select class="adm-select" [(ngModel)]="form.category">
                @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
              </select>
            </div>
            <div class="adm-field">
              <label class="adm-field-label">Status</label>
              <select class="adm-select" [(ngModel)]="form.status">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Excerpt</label>
            <textarea class="adm-textarea" [(ngModel)]="form.excerpt" placeholder="A short summary for listings…" style="min-height: 70px"></textarea>
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Story Body</label>
            <div class="adm-rte">
              <div class="adm-rte-toolbar">
                <button type="button" class="adm-rte-btn" (click)="exec('bold')"><b>B</b></button>
                <button type="button" class="adm-rte-btn" (click)="exec('italic')"><i>I</i></button>
                <button type="button" class="adm-rte-btn" (click)="exec('underline')"><u>U</u></button>
                <span style="width: 1px; background: var(--ad-border); margin: 4px 2px"></span>
                <button type="button" class="adm-rte-btn" (click)="exec('formatBlock', 'h2')">H</button>
                <button type="button" class="adm-rte-btn" (click)="exec('formatBlock', 'blockquote')">❝</button>
                <button type="button" class="adm-rte-btn" (click)="exec('insertUnorderedList')">•</button>
                <span style="width: 1px; background: var(--ad-border); margin: 4px 2px"></span>
                <button type="button" class="adm-rte-btn" (click)="exec('justifyLeft')">≡</button>
                <button type="button" class="adm-rte-btn" (click)="exec('justifyCenter')">≣</button>
              </div>
              <div
                class="adm-rte-area"
                contenteditable="true"
                [innerHTML]="form.body || ''"
                #rte
                (input)="form.body = rte.innerHTML"
              ></div>
            </div>
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Featured Image</label>
            <div class="adm-dropzone" style="padding: 24px">
              <div style="font-size: 1.4rem">🖼</div>
              <div style="margin-top: 6px">Click or drop an image to set the story cover</div>
            </div>
          </div>
        </div>
        <div foot>
          <button class="adm-btn adm-btn-outline" (click)="showModal.set(false)">Cancel</button>
          <button class="adm-btn adm-btn-outline" (click)="save(true)">Save draft</button>
          <button class="adm-btn adm-btn-primary" (click)="save(false)">{{ editing() ? 'Update & publish' : 'Publish' }}</button>
        </div>
      </app-adm-modal>
    }

    @if (deleteTarget()) {
      <app-adm-confirm
        [message]="'Delete &quot;' + deleteTarget()!.title + '&quot;?'"
        confirmLabel="Delete"
        (confirm)="confirmDelete()"
        (cancel)="deleteTarget.set(null)"
      ></app-adm-confirm>
    }
  `,
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
        authorAvatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop',
        category: this.form.category || 'History',
        status,
        date: new Date().toISOString().slice(0, 10),
        views: 0,
        comments: 0,
        cover: 'https://images.pexels.com/photos/15970572/pexels-photo-15970572.jpeg?auto=compress&cs=tinysrgb&w=400&h=240&fit=crop',
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
