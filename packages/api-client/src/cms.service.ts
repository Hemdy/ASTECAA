import { Injectable } from '@angular/core';
import { getAstecApiUrl } from '@astec/config';
import type {
  CmsGalleryItem,
  CmsTimelineMilestone,
  CmsCommunityMessage,
  CmsStory,
  CmsAnnouncement,
  CmsHomepageSettings,
  CmsMediaItem,
} from '@astec/types';

@Injectable({ providedIn: 'root' })
export class CmsApiService {
  // ==================== PUBLIC ====================

  async getGallery(album?: string, year?: number, featured?: boolean): Promise<CmsGalleryItem[]> {
    const params = new URLSearchParams();
    if (album) params.set('album', album);
    if (year !== undefined && year !== null && String(year) !== '') params.set('year', String(year));
    if (featured !== undefined) params.set('featured', String(featured));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<CmsGalleryItem[]>(`/api/v1/gallery${qs}`);
  }

  async getTimeline(): Promise<CmsTimelineMilestone[]> {
    return this.request<CmsTimelineMilestone[]>('/api/v1/timeline');
  }

  async getCommunityMessages(page = 'community', status = 'approved', userEmail?: string): Promise<CmsCommunityMessage[]> {
    const params = new URLSearchParams({ page, status });
    if (userEmail) params.set('userEmail', userEmail);
    return this.request<CmsCommunityMessage[]>(`/api/v1/community?${params.toString()}`);
  }

  async postCommunityMessage(data: {
    author: string;
    email: string;
    phone?: string;
    graduationYear?: string;
    location?: string;
    avatar?: string;
    message: string;
    page?: string;
    userId?: string;
  }): Promise<CmsCommunityMessage> {
    return this.request<CmsCommunityMessage>('/api/v1/community', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async replyCommunityMessage(
    id: string,
    data: {
      author: string;
      email: string;
      message: string;
      graduationYear?: string;
      avatar?: string;
      userId?: string;
    },
  ): Promise<any> {
    return this.request(`/api/v1/community/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reactCommunityMessage(
    id: string,
    data: {
      reaction: string;
      userEmail: string;
      userId?: string;
    },
  ): Promise<{ messageId: string; reaction: string; active: boolean; reactions: Record<string, number> }> {
    return this.request(`/api/v1/community/${id}/react`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserCommunityNotes(idOrEmail: string): Promise<any[]> {
    return this.request<any[]>(`/api/v1/community/user/${encodeURIComponent(idOrEmail)}`);
  }

  async likeCommunityMessage(id: string): Promise<{ id: string; likes: number }> {
    return this.request<{ id: string; likes: number }>(`/api/v1/community/${id}/like`, {
      method: 'POST',
    });
  }

  async getAnnouncements(): Promise<CmsAnnouncement[]> {
    return this.request<CmsAnnouncement[]>('/api/v1/announcements');
  }

  async getStories(category?: string): Promise<CmsStory[]> {
    const qs = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<CmsStory[]>(`/api/v1/stories${qs}`);
  }

  async getHomepage(): Promise<CmsHomepageSettings | null> {
    return this.request<CmsHomepageSettings | null>('/api/v1/site-content/homepage');
  }

  // ==================== ADMIN CMS ====================

  // Gallery
  async adminListGallery(album?: string): Promise<CmsGalleryItem[]> {
    const qs = album ? `?album=${encodeURIComponent(album)}` : '';
    return this.request<CmsGalleryItem[]>(`/api/admin/v1/gallery${qs}`, {}, true);
  }

  async createGalleryItem(data: Partial<CmsGalleryItem>): Promise<CmsGalleryItem> {
    return this.request<CmsGalleryItem>('/api/admin/v1/gallery', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async updateGalleryItem(id: string, data: Partial<CmsGalleryItem>): Promise<CmsGalleryItem> {
    return this.request<CmsGalleryItem>(`/api/admin/v1/gallery/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  }

  async deleteGalleryItem(id: string): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(`/api/admin/v1/gallery/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // Timeline
  async createMilestone(data: Partial<CmsTimelineMilestone>): Promise<CmsTimelineMilestone> {
    return this.request<CmsTimelineMilestone>('/api/admin/v1/timeline', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async updateMilestone(id: string, data: Partial<CmsTimelineMilestone>): Promise<CmsTimelineMilestone> {
    return this.request<CmsTimelineMilestone>(`/api/admin/v1/timeline/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  }

  async deleteMilestone(id: string): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(`/api/admin/v1/timeline/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // Comments / Moderation
  async adminListComments(status?: string, page?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (page) params.set('page', page);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/api/admin/v1/comments${qs}`, {}, true);
  }

  async updateCommentStatus(id: string, status: 'approved' | 'pending' | 'reported' | 'spam'): Promise<any> {
    return this.request<any>(`/api/admin/v1/comments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, true);
  }

  async deleteComment(id: string): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(`/api/admin/v1/comments/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // Stories
  async adminListStories(): Promise<CmsStory[]> {
    return this.request<CmsStory[]>('/api/admin/v1/stories', {}, true);
  }

  async createStory(data: Partial<CmsStory>): Promise<CmsStory> {
    return this.request<CmsStory>('/api/admin/v1/stories', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async updateStory(id: string, data: Partial<CmsStory>): Promise<CmsStory> {
    return this.request<CmsStory>(`/api/admin/v1/stories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  }

  async deleteStory(id: string): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(`/api/admin/v1/stories/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // Announcements
  async adminListAnnouncements(): Promise<CmsAnnouncement[]> {
    return this.request<CmsAnnouncement[]>('/api/admin/v1/announcements', {}, true);
  }

  async createAnnouncement(data: Partial<CmsAnnouncement>): Promise<CmsAnnouncement> {
    return this.request<CmsAnnouncement>('/api/admin/v1/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async updateAnnouncement(id: string, data: Partial<CmsAnnouncement>): Promise<CmsAnnouncement> {
    return this.request<CmsAnnouncement>(`/api/admin/v1/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  }

  async deleteAnnouncement(id: string): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(`/api/admin/v1/announcements/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // Homepage Settings
  async adminGetHomepage(): Promise<CmsHomepageSettings | null> {
    return this.request<CmsHomepageSettings | null>('/api/admin/v1/homepage', {}, true);
  }

  async adminUpdateHomepage(data: CmsHomepageSettings): Promise<CmsHomepageSettings> {
    return this.request<CmsHomepageSettings>('/api/admin/v1/homepage', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  // Media
  async adminListMedia(folder?: string): Promise<CmsMediaItem[]> {
    const qs = folder ? `?folder=${encodeURIComponent(folder)}` : '';
    return this.request<CmsMediaItem[]>(`/api/admin/v1/media${qs}`, {}, true);
  }

  async adminUploadMedia(
    fileBase64: string,
    name: string,
    type?: string,
    folder?: string
  ): Promise<CmsMediaItem> {
    return this.request<CmsMediaItem>('/api/admin/v1/media/upload', {
      method: 'POST',
      body: JSON.stringify({ file: fileBase64, name, type, folder }),
    }, true);
  }

  async adminDeleteMedia(id: string): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(`/api/admin/v1/media/${id}`, {
      method: 'DELETE',
    }, true);
  }

  // ==================== BASE REQUEST HELPER ====================

  private async request<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${getAstecApiUrl()}${path}`, {
      ...init,
      headers,
      credentials: authenticated ? 'include' : 'same-origin',
      cache: 'no-store',
    });

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const msg =
        typeof body === 'object' && body !== null && 'error' in body
          ? (body as any).error?.message || (body as any).error
          : `Request failed (${response.status})`;
      throw new Error(msg);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }
}

