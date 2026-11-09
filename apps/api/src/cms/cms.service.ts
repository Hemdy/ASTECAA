import { Injectable, Logger } from '@nestjs/common';
import { eq, desc, asc, and, sql, or } from 'drizzle-orm';
import {
  galleryItems,
  timelineMilestones,
  communityMessages,
  stories,
  announcements,
  siteContent,
  mediaFiles,
} from '@astec/database';
import { DatabaseService } from '../database/database.service.js';
import { StorageService } from '../storage/storage.service.js';
import { AppError } from '../core/app-error.js';

@Injectable()
export class CmsService {
  private readonly logger = new Logger(CmsService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly storage: StorageService
  ) {}

  // ==================== GALLERY ====================

  async listGallery(album?: string, year?: number, featured?: boolean) {
    const db = this.database.db;
    const conditions = [];
    if (album) conditions.push(eq(galleryItems.album, album));
    if (year) conditions.push(eq(galleryItems.year, year));
    if (featured !== undefined) conditions.push(eq(galleryItems.featured, featured));

    const rows = conditions.length > 0
      ? await db.select().from(galleryItems).where(and(...conditions)).orderBy(desc(galleryItems.createdAt))
      : await db.select().from(galleryItems).orderBy(desc(galleryItems.createdAt));

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      url: r.url,
      album: r.album,
      year: r.year,
      mediaType: r.mediaType as 'photo' | 'video',
      featured: r.featured,
      size: r.size,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createGalleryItem(data: {
    title: string;
    description?: string;
    url: string;
    album: string;
    year: number;
    mediaType?: 'photo' | 'video';
    featured?: boolean;
    size?: string;
  }) {
    const db = this.database.db;
    const [created] = await db
      .insert(galleryItems)
      .values({
        title: data.title,
        description: data.description,
        url: data.url,
        album: data.album,
        year: data.year,
        mediaType: data.mediaType || 'photo',
        featured: data.featured || false,
        size: data.size,
      })
      .returning();
    return created;
  }

  async updateGalleryItem(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      url: string;
      album: string;
      year: number;
      mediaType: 'photo' | 'video';
      featured: boolean;
      size: string;
    }>
  ) {
    const db = this.database.db;
    const [updated] = await db
      .update(galleryItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(galleryItems.id, id))
      .returning();
    if (!updated) throw new AppError(404, 'Gallery item not found.', 'NOT_FOUND');
    return updated;
  }

  async deleteGalleryItem(id: string) {
    const db = this.database.db;
    const [deleted] = await db.delete(galleryItems).where(eq(galleryItems.id, id)).returning();
    if (!deleted) throw new AppError(404, 'Gallery item not found.', 'NOT_FOUND');
    return { success: true, id };
  }

  // ==================== TIMELINE ====================

  async listTimeline() {
    const db = this.database.db;
    const rows = await db
      .select()
      .from(timelineMilestones)
      .orderBy(asc(timelineMilestones.year), asc(timelineMilestones.sortOrder));

    return rows.map((r) => ({
      id: r.id,
      year: r.year,
      title: r.title,
      subtitle: r.subtitle,
      story: r.story,
      quote: r.quote,
      quoteAuthor: r.quoteAuthor,
      imageUrl: r.imageUrl,
      sortOrder: r.sortOrder,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createMilestone(data: {
    year: number;
    title: string;
    subtitle?: string;
    story: string;
    quote?: string;
    quoteAuthor?: string;
    imageUrl?: string;
    sortOrder?: number;
  }) {
    const db = this.database.db;
    const [created] = await db
      .insert(timelineMilestones)
      .values({
        year: data.year,
        title: data.title,
        subtitle: data.subtitle,
        story: data.story,
        quote: data.quote,
        quoteAuthor: data.quoteAuthor,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning();
    return created;
  }

  async updateMilestone(
    id: string,
    data: Partial<{
      year: number;
      title: string;
      subtitle: string;
      story: string;
      quote: string;
      quoteAuthor: string;
      imageUrl: string;
      sortOrder: number;
    }>
  ) {
    const db = this.database.db;
    const [updated] = await db
      .update(timelineMilestones)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(timelineMilestones.id, id))
      .returning();
    if (!updated) throw new AppError(404, 'Milestone not found.', 'NOT_FOUND');
    return updated;
  }

  async deleteMilestone(id: string) {
    const db = this.database.db;
    const [deleted] = await db.delete(timelineMilestones).where(eq(timelineMilestones.id, id)).returning();
    if (!deleted) throw new AppError(404, 'Milestone not found.', 'NOT_FOUND');
    return { success: true, id };
  }

  // ==================== COMMUNITY MESSAGES / COMMENTS ====================

  async listCommunityMessages(page: string = 'community', status: string = 'approved') {
    const db = this.database.db;
    const conditions = [];
    if (page) conditions.push(eq(communityMessages.page, page));
    if (status) conditions.push(eq(communityMessages.status, status));

    const rows = await db
      .select()
      .from(communityMessages)
      .where(and(...conditions))
      .orderBy(desc(communityMessages.pinned), desc(communityMessages.createdAt));

    return rows.map((r) => ({
      id: r.id,
      author: r.author,
      email: r.email,
      phone: r.phone,
      graduationYear: r.graduationYear,
      location: r.location,
      avatar: r.avatar,
      message: r.message,
      page: r.page,
      targetId: r.targetId,
      status: r.status as 'approved' | 'pending' | 'reported' | 'spam',
      likes: r.likes,
      pinned: r.pinned,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async adminListCommunityMessages(statusFilter?: string, pageFilter?: string) {
    const db = this.database.db;
    const conditions = [];
    if (statusFilter && statusFilter !== 'all') conditions.push(eq(communityMessages.status, statusFilter));
    if (pageFilter && pageFilter !== 'all') conditions.push(eq(communityMessages.page, pageFilter));

    const rows = conditions.length > 0
      ? await db.select().from(communityMessages).where(and(...conditions)).orderBy(desc(communityMessages.createdAt))
      : await db.select().from(communityMessages).orderBy(desc(communityMessages.createdAt));

    return rows.map((r) => ({
      id: r.id,
      author: r.author,
      email: r.email,
      phone: r.phone,
      graduationYear: r.graduationYear,
      location: r.location,
      avatar: r.avatar || '/images/reading-room.jpg',
      message: r.message,
      page: r.page,
      status: r.status as 'approved' | 'pending' | 'reported' | 'spam',
      likes: r.likes,
      reports: 0,
      date: r.createdAt.toISOString().slice(0, 10),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createCommunityMessage(data: {
    author: string;
    email: string;
    phone?: string;
    graduationYear?: string;
    location?: string;
    avatar?: string;
    message: string;
    page?: string;
    targetId?: string;
  }) {
    if (!data.author?.trim() || !data.email?.trim() || !data.message?.trim()) {
      throw new AppError(400, 'Author, email, and message are required.', 'INVALID_INPUT');
    }
    const db = this.database.db;
    const [created] = await db
      .insert(communityMessages)
      .values({
        author: data.author.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || null,
        graduationYear: data.graduationYear?.trim() || null,
        location: data.location?.trim() || 'Global Alumni',
        avatar: data.avatar || '/images/reading-room.jpg',
        message: data.message.trim(),
        page: data.page || 'community',
        targetId: data.targetId || null,
        status: 'approved',
        likes: 0,
        pinned: false,
      })
      .returning();
    return created;
  }

  async likeCommunityMessage(id: string) {
    const db = this.database.db;
    const [updated] = await db
      .update(communityMessages)
      .set({ likes: sql`${communityMessages.likes} + 1` })
      .where(eq(communityMessages.id, id))
      .returning({ id: communityMessages.id, likes: communityMessages.likes });
    if (!updated) throw new AppError(404, 'Message not found.', 'NOT_FOUND');
    return updated;
  }

  async updateMessageStatus(id: string, status: 'approved' | 'pending' | 'reported' | 'spam') {
    const db = this.database.db;
    const [updated] = await db
      .update(communityMessages)
      .set({ status, updatedAt: new Date() })
      .where(eq(communityMessages.id, id))
      .returning();
    if (!updated) throw new AppError(404, 'Message not found.', 'NOT_FOUND');
    return updated;
  }

  async deleteCommunityMessage(id: string) {
    const db = this.database.db;
    const [deleted] = await db.delete(communityMessages).where(eq(communityMessages.id, id)).returning();
    if (!deleted) throw new AppError(404, 'Message not found.', 'NOT_FOUND');
    return { success: true, id };
  }

  // ==================== STORIES ====================

  async listStories(status: string = 'published', category?: string) {
    const db = this.database.db;
    const conditions = [];
    if (status) conditions.push(eq(stories.status, status));
    if (category) conditions.push(eq(stories.category, category));

    const rows = await db
      .select()
      .from(stories)
      .where(and(...conditions))
      .orderBy(desc(stories.createdAt));

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      body: r.body,
      category: r.category,
      cover: r.cover,
      author: r.author,
      authorAvatar: r.authorAvatar,
      status: r.status,
      views: r.views,
      commentsCount: r.commentsCount,
      date: r.createdAt.toISOString().slice(0, 10),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createStory(data: {
    title: string;
    excerpt: string;
    body: string;
    category?: string;
    cover?: string;
    author: string;
    authorAvatar?: string;
    status?: string;
  }) {
    const db = this.database.db;
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${Date.now().toString(36)}`;
    const [created] = await db
      .insert(stories)
      .values({
        slug,
        title: data.title,
        excerpt: data.excerpt,
        body: data.body,
        category: data.category || 'History',
        cover: data.cover || '/images/voices-oral-history.jpg',
        author: data.author,
        authorAvatar: data.authorAvatar || '/images/ASTECAA.jpg',
        status: data.status || 'published',
      })
      .returning();
    return created;
  }

  async updateStory(id: string, data: Partial<{
    title: string;
    excerpt: string;
    body: string;
    category: string;
    cover: string;
    status: string;
  }>) {
    const db = this.database.db;
    const [updated] = await db
      .update(stories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(stories.id, id))
      .returning();
    if (!updated) throw new AppError(404, 'Story not found.', 'NOT_FOUND');
    return updated;
  }

  async deleteStory(id: string) {
    const db = this.database.db;
    const [deleted] = await db.delete(stories).where(eq(stories.id, id)).returning();
    if (!deleted) throw new AppError(404, 'Story not found.', 'NOT_FOUND');
    return { success: true, id };
  }

  // ==================== ANNOUNCEMENTS ====================

  async listAnnouncements(status: string = 'published') {
    const db = this.database.db;
    const rows = status
      ? await db.select().from(announcements).where(eq(announcements.status, status)).orderBy(desc(announcements.pinned), desc(announcements.createdAt))
      : await db.select().from(announcements).orderBy(desc(announcements.pinned), desc(announcements.createdAt));

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      date: r.date,
      status: r.status as 'published' | 'scheduled' | 'draft',
      pinned: r.pinned,
      channel: r.channel as 'email' | 'push' | 'site',
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createAnnouncement(data: {
    title: string;
    body: string;
    date?: string;
    status?: 'published' | 'scheduled' | 'draft';
    pinned?: boolean;
    channel?: 'email' | 'push' | 'site';
  }) {
    const db = this.database.db;
    const [created] = await db
      .insert(announcements)
      .values({
        title: data.title,
        body: data.body,
        date: data.date || new Date().toISOString().slice(0, 10),
        status: data.status || 'published',
        pinned: data.pinned ?? false,
        channel: data.channel || 'site',
      })
      .returning();
    return created;
  }

  async updateAnnouncement(id: string, data: Partial<{
    title: string;
    body: string;
    date: string;
    status: 'published' | 'scheduled' | 'draft';
    pinned: boolean;
    channel: 'email' | 'push' | 'site';
  }>) {
    const db = this.database.db;
    const [updated] = await db
      .update(announcements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    if (!updated) throw new AppError(404, 'Announcement not found.', 'NOT_FOUND');
    return updated;
  }

  async deleteAnnouncement(id: string) {
    const db = this.database.db;
    const [deleted] = await db.delete(announcements).where(eq(announcements.id, id)).returning();
    if (!deleted) throw new AppError(404, 'Announcement not found.', 'NOT_FOUND');
    return { success: true, id };
  }

  // ==================== SITE CONTENT / HOMEPAGE ====================

  async getSiteContent(key: string) {
    const db = this.database.db;
    const row = await db.query.siteContent.findFirst({
      where: eq(siteContent.id, key),
    });
    return row?.content ?? null;
  }

  async updateSiteContent(key: string, content: any) {
    const db = this.database.db;
    const [saved] = await db
      .insert(siteContent)
      .values({
        id: key,
        content,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: siteContent.id,
        set: { content, updatedAt: new Date() },
      })
      .returning();
    return saved.content;
  }

  // ==================== MEDIA MANAGEMENT ====================

  async listMedia(folder?: string) {
    const db = this.database.db;
    const rows = folder && folder !== 'all'
      ? await db.select().from(mediaFiles).where(eq(mediaFiles.folder, folder)).orderBy(desc(mediaFiles.createdAt))
      : await db.select().from(mediaFiles).orderBy(desc(mediaFiles.createdAt));

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      url: r.url,
      type: r.mediaType as 'image' | 'video',
      size: r.sizeFormatted || '1.0 MB',
      folder: r.folder,
      storageKey: r.storageKey,
      date: r.createdAt.toISOString().slice(0, 10),
    }));
  }

  async saveMedia(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'General'
  ) {
    const uploadResult = await this.storage.upload(buffer, originalName, mimeType, folder);
    const mediaType = mimeType.startsWith('video') ? 'video' : 'image';

    const db = this.database.db;
    const [created] = await db
      .insert(mediaFiles)
      .values({
        name: uploadResult.name,
        url: uploadResult.url,
        mediaType,
        sizeBytes: uploadResult.sizeBytes,
        sizeFormatted: uploadResult.sizeFormatted,
        folder,
        storageKey: uploadResult.key,
        mimeType,
      })
      .returning();

    return {
      id: created.id,
      name: created.name,
      url: created.url,
      type: created.mediaType as 'image' | 'video',
      size: created.sizeFormatted || '1.0 MB',
      folder: created.folder,
      storageKey: created.storageKey,
      date: created.createdAt.toISOString().slice(0, 10),
    };
  }

  async deleteMedia(id: string) {
    const db = this.database.db;
    const [record] = await db.select().from(mediaFiles).where(eq(mediaFiles.id, id)).limit(1);
    if (!record) throw new AppError(404, 'Media file not found.', 'NOT_FOUND');

    await this.storage.delete(record.storageKey);
    await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    return { success: true, id };
  }
}
