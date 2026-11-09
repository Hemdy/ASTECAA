import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import { AdmConfirm } from '../../components/adm-confirm/adm-confirm';
import { ToastService } from '@astec/ui';
import { CmsApiService } from '@astec/api-client';
import type { CmsStory } from '@astec/types';

@Component({
  selector: 'app-admin-stories',
  standalone: true,
  imports: [FormsModule, DecimalPipe, AdmModal, AdmConfirm],
  templateUrl: './admin-stories.html',
})
export class AdminStories implements OnInit {
  private cmsApi = inject(CmsApiService);
  private toast = inject(ToastService);

  stories = signal<CmsStory[]>([]);
  loading = signal(false);
  tab = signal<'all' | 'published' | 'draft' | 'archived'>('all');
  query = signal('');
  catFilter = signal('');
  showModal = signal(false);
  editing = signal(false);
  deleteTarget = signal<CmsStory | null>(null);

  categories = ['History', 'Reunion', 'Spotlight', 'Legacy', 'Culture', 'Education'];

  form: Partial<CmsStory> = {
    title: '',
    excerpt: '',
    category: 'History',
    status: 'draft',
    body: '',
    cover: '/images/ASTECAA.jpg',
  };

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
      const mq = !q || s.title.toLowerCase().includes(q) || (s.excerpt && s.excerpt.toLowerCase().includes(q));
      const mc = !c || s.category === c;
      return mt && mq && mc;
    });
  });

  ngOnInit() {
    void this.loadStories();
  }

  async loadStories() {
    this.loading.set(true);
    try {
      const data = await this.cmsApi.adminListStories();
      this.stories.set(data);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load stories');
    } finally {
      this.loading.set(false);
    }
  }

  shortDate(iso?: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  truncate(s?: string | null): string {
    if (!s) return '';
    return s.length > 60 ? s.slice(0, 60) + '…' : s;
  }

  exec(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
  }

  openCreate() {
    this.editing.set(false);
    this.form = {
      title: '',
      excerpt: '',
      category: 'History',
      status: 'draft',
      body: '',
      cover: '/images/ASTECAA.jpg',
    };
    this.showModal.set(true);
  }

  openEdit(s: CmsStory) {
    this.editing.set(true);
    this.form = { ...s };
    this.showModal.set(true);
  }

  async save(asDraft: boolean) {
    if (!this.form.title?.trim()) {
      this.toast.show('Please give the story a title.');
      return;
    }
    const status: 'draft' | 'published' = asDraft ? 'draft' : 'published';
    const payload: Partial<CmsStory> = {
      title: this.form.title.trim(),
      slug: this.form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: this.form.excerpt || '',
      body: this.form.body || '',
      category: this.form.category || 'History',
      cover: this.form.cover || '/images/ASTECAA.jpg',
      status,
      author: this.form.author || 'ASTECAA Editorial',
      authorAvatar: this.form.authorAvatar || '/images/avatar-marlene.jpg',
    };

    try {
      if (this.editing() && this.form.id) {
        await this.cmsApi.updateStory(this.form.id, payload);
        this.toast.show(asDraft ? 'Draft updated.' : 'Story published.');
      } else {
        await this.cmsApi.createStory(payload);
        this.toast.show(asDraft ? 'Draft created.' : 'Story published.');
      }
      this.showModal.set(false);
      await this.loadStories();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to save story');
    }
  }

  async toggleArchive(s: CmsStory) {
    const nextStatus = s.status === 'archived' ? 'published' : 'archived';
    try {
      await this.cmsApi.updateStory(s.id, { status: nextStatus });
      this.toast.show(nextStatus === 'archived' ? 'Story archived.' : 'Story restored.');
      await this.loadStories();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to update status');
    }
  }

  askDelete(s: CmsStory) {
    this.deleteTarget.set(s);
  }

  async confirmDelete() {
    const t = this.deleteTarget();
    if (!t) return;
    try {
      await this.cmsApi.deleteStory(t.id);
      this.toast.show('Story deleted.');
      this.deleteTarget.set(null);
      await this.loadStories();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to delete story');
    }
  }

  async onCoverSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          const media = await this.cmsApi.adminUploadMedia(base64, file.name, file.type, 'stories');
          this.form.cover = media.url;
          this.toast.show('Story cover uploaded.');
        } catch (err: any) {
          this.toast.show(err.message || 'Failed to upload cover');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/empty/image-fallback.jpg';
  }

  onAvatarImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/empty/avatar-fallback.jpg';
  }
}
