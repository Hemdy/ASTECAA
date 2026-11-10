import { Injectable, Logger } from '@nestjs/common';
import { eq, desc, asc, and, sql, or, inArray } from 'drizzle-orm';
import {
  galleryItems,
  timelineMilestones,
  communityMessages,
  communityReplies,
  communityReactions,
  appUsers,
  stories,
  announcements,
  siteContent,
  mediaFiles,
  contactSubmissions,
  mediaFolders,
  adminNotifications,
  events,
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

  private async formatGalleryItem(r: typeof galleryItems.$inferSelect, requestOrigin?: string) {
    const resolvedUrl = await this.storage.normalizeMediaUrl(r.url, null, requestOrigin);
    return {
      id: r.id,
      title: r.title,
      caption: r.description,
      description: r.description,
      url: resolvedUrl,
      thumb: resolvedUrl,
      album: r.album,
      year: r.year,
      type: r.mediaType as 'photo' | 'video',
      mediaType: r.mediaType as 'photo' | 'video',
      featured: r.featured,
      size: r.size,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  async listGallery(album?: string, year?: number, featured?: boolean, requestOrigin?: string) {
    const db = this.database.db;
    const conditions = [];
    if (album) conditions.push(eq(galleryItems.album, album));
    if (year) conditions.push(eq(galleryItems.year, year));
    if (featured !== undefined) conditions.push(eq(galleryItems.featured, featured));

    const rows = conditions.length > 0
      ? await db.select().from(galleryItems).where(and(...conditions)).orderBy(desc(galleryItems.createdAt))
      : await db.select().from(galleryItems).orderBy(desc(galleryItems.createdAt));

    return Promise.all(rows.map((r) => this.formatGalleryItem(r, requestOrigin)));
  }

  async createGalleryItem(data: {
    title: string;
    caption?: string | null;
    description?: string | null;
    url: string;
    album: string;
    year: number;
    type?: 'photo' | 'video';
    mediaType?: 'photo' | 'video';
    featured?: boolean;
    size?: string;
  }, requestOrigin?: string) {
    const db = this.database.db;
    const description = data.description ?? data.caption ?? null;
    const mediaType = (data.mediaType ?? data.type) === 'video' ? 'video' : 'photo';
    const normalizedUrl = await this.storage.normalizeMediaUrl(data.url, null, requestOrigin);

    const [created] = await db
      .insert(galleryItems)
      .values({
        title: data.title,
        description,
        url: normalizedUrl || data.url,
        album: data.album,
        year: data.year,
        mediaType,
        featured: Boolean(data.featured),
        size: data.size,
      })
      .returning();
    return this.formatGalleryItem(created, requestOrigin);
  }

  async updateGalleryItem(
    id: string,
    data: Partial<{
      title: string;
      caption: string | null;
      description: string | null;
      url: string;
      album: string;
      year: number;
      type: 'photo' | 'video';
      mediaType: 'photo' | 'video';
      featured: boolean;
      size: string;
    }>,
    requestOrigin?: string,
  ) {
    const db = this.database.db;
    const updates: Partial<typeof galleryItems.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined || data.caption !== undefined) {
      updates.description = data.description ?? data.caption ?? null;
    }
    if (data.url !== undefined) {
      updates.url = await this.storage.normalizeMediaUrl(data.url, null, requestOrigin);
    }
    if (data.album !== undefined) updates.album = data.album;
    if (data.year !== undefined) updates.year = data.year;
    if (data.mediaType !== undefined || data.type !== undefined) {
      updates.mediaType = (data.mediaType ?? data.type) === 'video' ? 'video' : 'photo';
    }
    if (data.featured !== undefined) updates.featured = data.featured;
    if (data.size !== undefined) updates.size = data.size;

    const [updated] = await db
      .update(galleryItems)
      .set(updates)
      .where(eq(galleryItems.id, id))
      .returning();
    if (!updated) throw new AppError(404, 'Gallery item not found.', 'NOT_FOUND');
    return this.formatGalleryItem(updated, requestOrigin);
  }

  async getMediaObject(key: string) {
    return this.storage.getObject(key);
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

  async listCommunityMessages(page: string = 'community', status: string = 'approved', userEmail?: string) {
    const db = this.database.db;
    const conditions = [];
    if (page) conditions.push(eq(communityMessages.page, page));
    if (status) conditions.push(eq(communityMessages.status, status));

    const rows = await db
      .select()
      .from(communityMessages)
      .where(and(...conditions))
      .orderBy(desc(communityMessages.pinned), desc(communityMessages.createdAt));

    if (rows.length === 0) return [];

    const messageIds = rows.map((r) => r.id);

    // Fetch replies for these messages
    const repliesRows = await db
      .select()
      .from(communityReplies)
      .where(inArray(communityReplies.messageId, messageIds))
      .orderBy(asc(communityReplies.createdAt));

    const repliesByMessage = new Map<string, typeof repliesRows>();
    for (const reply of repliesRows) {
      if (!repliesByMessage.has(reply.messageId)) {
        repliesByMessage.set(reply.messageId, []);
      }
      repliesByMessage.get(reply.messageId)!.push(reply);
    }

    // Fetch reactions for these messages
    const reactionsRows = await db
      .select()
      .from(communityReactions)
      .where(inArray(communityReactions.messageId, messageIds));

    const reactionsByMessage = new Map<string, Record<string, number>>();
    const userReactionsByMessage = new Map<string, string[]>();

    const normalizedUserEmail = userEmail?.trim().toLowerCase();

    for (const rxn of reactionsRows) {
      if (!reactionsByMessage.has(rxn.messageId)) {
        reactionsByMessage.set(rxn.messageId, {});
      }
      const counts = reactionsByMessage.get(rxn.messageId)!;
      counts[rxn.reaction] = (counts[rxn.reaction] || 0) + 1;

      if (normalizedUserEmail && rxn.userEmail.toLowerCase() === normalizedUserEmail) {
        if (!userReactionsByMessage.has(rxn.messageId)) {
          userReactionsByMessage.set(rxn.messageId, []);
        }
        userReactionsByMessage.get(rxn.messageId)!.push(rxn.reaction);
      }
    }

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
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
      replies: (repliesByMessage.get(r.id) || []).map((rep) => ({
        id: rep.id,
        messageId: rep.messageId,
        userId: rep.userId,
        author: rep.author,
        email: rep.email,
        avatar: rep.avatar,
        graduationYear: rep.graduationYear,
        message: rep.message,
        createdAt: rep.createdAt.toISOString(),
      })),
      reactions: reactionsByMessage.get(r.id) || { heart: 0, clap: 0, celebrate: 0, inspire: 0 },
      userReactions: userReactionsByMessage.get(r.id) || [],
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

    const msgIds = rows.map((r) => r.id);
    const allReplies = msgIds.length > 0
      ? await db.select().from(communityReplies).where(inArray(communityReplies.messageId, msgIds)).orderBy(asc(communityReplies.createdAt))
      : [];
    const repliesByMessage = new Map<string, Array<any>>();
    for (const rep of allReplies) {
      const list = repliesByMessage.get(rep.messageId) || [];
      list.push({
        id: rep.id,
        messageId: rep.messageId,
        userId: rep.userId,
        author: rep.author,
        email: rep.email,
        avatar: rep.avatar,
        graduationYear: rep.graduationYear,
        message: rep.message,
        createdAt: rep.createdAt.toISOString(),
      });
      repliesByMessage.set(rep.messageId, list);
    }

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
      replies: repliesByMessage.get(r.id) || [],
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
    userId?: string;
  }) {
    if (!data.author?.trim() || !data.email?.trim() || !data.message?.trim()) {
      throw new AppError(400, 'Author, email, and message are required.', 'INVALID_INPUT');
    }
    const db = this.database.db;
    const emailNormalized = data.email.trim().toLowerCase();

    // Verify valid user ID if provided
    let verifiedUserId: string | null = null;
    if (data.userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.userId)) {
      const u = await db.query.appUsers.findFirst({
        where: eq(appUsers.id, data.userId),
        columns: { id: true },
      });
      if (u) verifiedUserId = u.id;
    }

    if (!verifiedUserId) {
      const u = await db.query.appUsers.findFirst({
        where: eq(appUsers.emailNormalized, emailNormalized),
        columns: { id: true },
      });
      if (u) verifiedUserId = u.id;
    }

    const [created] = await db
      .insert(communityMessages)
      .values({
        userId: verifiedUserId,
        author: data.author.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || null,
        graduationYear: data.graduationYear?.trim() || null,
        location: data.location?.trim() || (data.graduationYear ? `Class of ${data.graduationYear.trim()}` : 'Global Alumni'),
        avatar: data.avatar || '/images/reading-room.jpg',
        message: data.message.trim(),
        page: data.page || 'community',
        targetId: data.targetId || null,
        status: 'approved',
        likes: 0,
        pinned: false,
      })
      .returning();

    void db.insert(adminNotifications).values({
      type: 'comment',
      title: 'New Community Note',
      message: `${data.author.trim()} posted on ${data.page || 'community'}: "${data.message.trim().slice(0, 50)}…"`,
      link: '/admin/comments',
      read: false,
    }).catch(() => {});

    return created;
  }

  async createCommunityReply(
    messageId: string,
    data: {
      author: string;
      email: string;
      message: string;
      graduationYear?: string;
      avatar?: string;
      userId?: string;
    },
  ) {
    if (!data.author?.trim() || !data.email?.trim() || !data.message?.trim()) {
      throw new AppError(400, 'Author, email, and message are required to reply.', 'INVALID_INPUT');
    }
    const db = this.database.db;
    const [msg] = await db
      .select({ id: communityMessages.id })
      .from(communityMessages)
      .where(eq(communityMessages.id, messageId))
      .limit(1);

    if (!msg) {
      throw new AppError(404, 'Community note not found.', 'NOT_FOUND');
    }

    let verifiedUserId: string | null = null;
    if (data.userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.userId)) {
      const u = await db.query.appUsers.findFirst({
        where: eq(appUsers.id, data.userId),
        columns: { id: true },
      });
      if (u) verifiedUserId = u.id;
    }

    const [reply] = await db
      .insert(communityReplies)
      .values({
        messageId: msg.id,
        userId: verifiedUserId,
        author: data.author.trim(),
        email: data.email.trim(),
        avatar: data.avatar || null,
        graduationYear: data.graduationYear?.trim() || null,
        message: data.message.trim(),
      })
      .returning();

    return {
      id: reply.id,
      messageId: reply.messageId,
      userId: reply.userId,
      author: reply.author,
      email: reply.email,
      avatar: reply.avatar,
      graduationYear: reply.graduationYear,
      message: reply.message,
      createdAt: reply.createdAt.toISOString(),
    };
  }

  async toggleCommunityReaction(
    messageId: string,
    reaction: string,
    userEmail: string,
    userId?: string,
  ) {
    const db = this.database.db;
    const cleanReaction = ['heart', 'clap', 'celebrate', 'inspire'].includes(reaction) ? reaction : 'heart';
    const emailNormalized = userEmail.trim().toLowerCase();

    const [msg] = await db
      .select({ id: communityMessages.id, likes: communityMessages.likes })
      .from(communityMessages)
      .where(eq(communityMessages.id, messageId))
      .limit(1);

    if (!msg) {
      throw new AppError(404, 'Community note not found.', 'NOT_FOUND');
    }

    let verifiedUserId: string | null = null;
    if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      const u = await db.query.appUsers.findFirst({
        where: eq(appUsers.id, userId),
        columns: { id: true },
      });
      if (u) verifiedUserId = u.id;
    }

    // Check if user already reacted with this reaction
    const [existing] = await db
      .select({ id: communityReactions.id })
      .from(communityReactions)
      .where(
        and(
          eq(communityReactions.messageId, messageId),
          eq(communityReactions.userEmail, emailNormalized),
          eq(communityReactions.reaction, cleanReaction),
        ),
      )
      .limit(1);

    let userReacted = false;
    if (existing) {
      // Remove reaction
      await db.delete(communityReactions).where(eq(communityReactions.id, existing.id));
      if (cleanReaction === 'heart') {
        await db
          .update(communityMessages)
          .set({ likes: sql`GREATEST(${communityMessages.likes} - 1, 0)` })
          .where(eq(communityMessages.id, messageId));
      }
      userReacted = false;
    } else {
      // Add reaction
      await db.insert(communityReactions).values({
        messageId,
        userId: verifiedUserId,
        userEmail: emailNormalized,
        reaction: cleanReaction,
      });
      if (cleanReaction === 'heart') {
        await db
          .update(communityMessages)
          .set({ likes: sql`${communityMessages.likes} + 1` })
          .where(eq(communityMessages.id, messageId));
      }
      userReacted = true;
    }

    // Return updated reaction counts for this message
    const allReactions = await db
      .select({ reaction: communityReactions.reaction })
      .from(communityReactions)
      .where(eq(communityReactions.messageId, messageId));

    const reactionsCount: Record<string, number> = { heart: 0, clap: 0, celebrate: 0, inspire: 0 };
    for (const r of allReactions) {
      reactionsCount[r.reaction] = (reactionsCount[r.reaction] || 0) + 1;
    }

    return {
      messageId,
      reaction: cleanReaction,
      active: userReacted,
      reactions: reactionsCount,
    };
  }

  async getUserCommunityNotes(userIdOrEmail: string) {
    const db = this.database.db;
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userIdOrEmail);

    const conditions = isId
      ? eq(communityMessages.userId, userIdOrEmail)
      : eq(communityMessages.email, userIdOrEmail.trim().toLowerCase());

    const rows = await db
      .select()
      .from(communityMessages)
      .where(conditions)
      .orderBy(desc(communityMessages.createdAt));

    return rows.map((r) => ({
      id: r.id,
      author: r.author,
      message: r.message,
      location: r.location,
      likes: r.likes,
      status: r.status,
      pinned: r.pinned,
      createdAt: r.createdAt.toISOString(),
    }));
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

    if (key === 'homepage' && content?.featured?.eventId) {
      try {
        await db.update(events).set({ featured: false });
        await db
          .update(events)
          .set({ featured: true })
          .where(eq(events.id, content.featured.eventId));
      } catch (err) {
        this.logger.warn(`Failed to sync featured event flag: ${err}`);
      }
    }

    return saved.content;
  }

  // ==================== MEDIA MANAGEMENT ====================

  async listMedia(folder?: string, requestOrigin?: string) {
    const db = this.database.db;
    const rows = folder && folder !== 'all'
      ? await db.select().from(mediaFiles).where(eq(mediaFiles.folder, folder)).orderBy(desc(mediaFiles.createdAt))
      : await db.select().from(mediaFiles).orderBy(desc(mediaFiles.createdAt));

    return Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        name: r.name,
        url: await this.storage.normalizeMediaUrl(r.url, r.storageKey, requestOrigin),
        type: r.mediaType as 'image' | 'video',
        size: r.sizeFormatted || '1.0 MB',
        folder: r.folder,
        storageKey: r.storageKey,
        date: r.createdAt.toISOString().slice(0, 10),
      })),
    );
  }

  async saveMedia(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'General',
    requestOrigin?: string,
  ) {
    const uploadResult = await this.storage.upload(
      buffer,
      originalName,
      mimeType,
      folder,
      requestOrigin,
    );
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

  // ==================== MEDIA FOLDERS ====================

  async listMediaFolders(): Promise<string[]> {
    const db = this.database.db;
    const defaultFolders = ['General', 'Gallery', 'Reunions', 'Concerts', 'Harvest'];
    const dbFolders = await db.select({ name: mediaFolders.name }).from(mediaFolders);
    const mediaFileFolders = await db
      .selectDistinct({ folder: mediaFiles.folder })
      .from(mediaFiles);

    const names = new Set<string>([
      ...defaultFolders,
      ...dbFolders.map((f) => f.name),
      ...mediaFileFolders.map((f) => f.folder).filter(Boolean),
    ]);
    return Array.from(names);
  }

  async createMediaFolder(name: string): Promise<{ success: boolean; name: string }> {
    const cleanName = name.trim();
    if (!cleanName) throw new AppError(400, 'Folder name is required.', 'INVALID_INPUT');
    const db = this.database.db;
    const [existing] = await db
      .select({ id: mediaFolders.id })
      .from(mediaFolders)
      .where(eq(mediaFolders.name, cleanName))
      .limit(1);

    if (!existing) {
      await db.insert(mediaFolders).values({ name: cleanName });
    }
    return { success: true, name: cleanName };
  }

  async deleteMediaFolder(name: string): Promise<{ success: boolean; name: string }> {
    const cleanName = name.trim();
    if (!cleanName) throw new AppError(400, 'Folder name is required.', 'INVALID_INPUT');
    if (cleanName.toLowerCase() === 'general') {
      throw new AppError(400, 'The default General folder cannot be deleted.', 'FORBIDDEN');
    }
    const db = this.database.db;
    await db.delete(mediaFolders).where(eq(mediaFolders.name, cleanName));
    await db
      .update(mediaFiles)
      .set({ folder: 'General' })
      .where(eq(mediaFiles.folder, cleanName));

    return { success: true, name: cleanName };
  }

  // ==================== CONTACT SUBMISSIONS ====================

  async submitContact(data: { name: string; email: string; subject: string; message: string }) {
    if (!data.name?.trim() || !data.email?.trim() || !data.subject?.trim() || !data.message?.trim()) {
      throw new AppError(400, 'All fields (name, email, subject, message) are required.', 'INVALID_INPUT');
    }
    const db = this.database.db;
    const [created] = await db
      .insert(contactSubmissions)
      .values({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        subject: data.subject.trim(),
        message: data.message.trim(),
        status: 'new',
        replies: [],
      })
      .returning();

    void db.insert(adminNotifications).values({
      type: 'contact',
      title: 'New Contact Inquiry',
      message: `${data.name.trim()} sent an inquiry: "${data.subject.trim()}"`,
      link: '/admin/contact',
      read: false,
    }).catch(() => {});

    return {
      id: created.id,
      name: created.name,
      email: created.email,
      subject: created.subject,
      message: created.message,
      status: created.status,
      replies: created.replies || [],
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async listContactSubmissions(status?: string) {
    const db = this.database.db;
    const rows = status && status !== 'all'
      ? await db.select().from(contactSubmissions).where(eq(contactSubmissions.status, status)).orderBy(desc(contactSubmissions.createdAt))
      : await db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      subject: r.subject,
      message: r.message,
      status: r.status,
      replies: r.replies || [],
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async replyContactSubmission(id: string, reply: { sender?: string; message: string }) {
    if (!reply.message?.trim()) {
      throw new AppError(400, 'Reply message cannot be empty.', 'INVALID_INPUT');
    }
    const db = this.database.db;
    const [sub] = await db.select().from(contactSubmissions).where(eq(contactSubmissions.id, id)).limit(1);
    if (!sub) throw new AppError(404, 'Contact submission not found.', 'NOT_FOUND');

    const newReply = {
      id: crypto.randomUUID(),
      sender: reply.sender?.trim() || 'ASTECAA Support',
      message: reply.message.trim(),
      sentAt: new Date().toISOString(),
    };

    const currentReplies = Array.isArray(sub.replies) ? sub.replies : [];
    const updatedReplies = [...currentReplies, newReply];

    const [updated] = await db
      .update(contactSubmissions)
      .set({
        replies: updatedReplies,
        status: 'replied',
        updatedAt: new Date(),
      })
      .where(eq(contactSubmissions.id, id))
      .returning();

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      subject: updated.subject,
      message: updated.message,
      status: updated.status,
      replies: updated.replies || [],
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async updateContactStatus(id: string, status: string) {
    if (!['new', 'read', 'replied', 'closed'].includes(status)) {
      throw new AppError(400, 'Invalid status.', 'INVALID_INPUT');
    }
    const db = this.database.db;
    const [sub] = await db.select().from(contactSubmissions).where(eq(contactSubmissions.id, id)).limit(1);
    if (!sub) throw new AppError(404, 'Contact submission not found.', 'NOT_FOUND');

    const [updated] = await db
      .update(contactSubmissions)
      .set({ status, updatedAt: new Date() })
      .where(eq(contactSubmissions.id, id))
      .returning();

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      subject: updated.subject,
      message: updated.message,
      status: updated.status,
      replies: updated.replies || [],
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ==================== ADMIN NOTIFICATIONS ====================

  async listAdminNotifications() {
    const db = this.database.db;
    let rows = await db
      .select()
      .from(adminNotifications)
      .orderBy(desc(adminNotifications.createdAt))
      .limit(30);

    // If notifications are completely empty, bootstrap from real existing database records
    if (rows.length === 0) {
      const [recentContacts, recentNotes, recentUsers] = await Promise.all([
        db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt)).limit(3),
        db.select().from(communityMessages).orderBy(desc(communityMessages.createdAt)).limit(3),
        db.select().from(appUsers).orderBy(desc(appUsers.createdAt)).limit(3),
      ]);

      const initial: Array<typeof adminNotifications.$inferInsert> = [];
      for (const c of recentContacts) {
        initial.push({
          type: 'contact',
          title: 'Contact Inquiry',
          message: `${c.name} submitted: "${c.subject}"`,
          link: '/admin/contact',
          read: c.status === 'replied' || c.status === 'closed',
          createdAt: c.createdAt,
        });
      }
      for (const m of recentNotes) {
        initial.push({
          type: 'comment',
          title: 'Community Note',
          message: `${m.author} posted: "${m.message.slice(0, 50)}…"`,
          link: '/admin/comments',
          read: m.status === 'approved',
          createdAt: m.createdAt,
        });
      }
      for (const u of recentUsers) {
        initial.push({
          type: 'user',
          title: 'Alumni Joined',
          message: `${u.fullName || u.email} joined the alumni community`,
          link: '/admin/users',
          read: u.status === 'active',
          createdAt: u.createdAt,
        });
      }

      if (initial.length > 0) {
        await db.insert(adminNotifications).values(initial);
        rows = await db
          .select()
          .from(adminNotifications)
          .orderBy(desc(adminNotifications.createdAt))
          .limit(30);
      }
    }

    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      text: r.message,
      message: r.message,
      link: r.link,
      unread: !r.read,
      read: r.read,
      time: this.formatRelativeTime(r.createdAt),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async markAdminNotificationRead(id: string) {
    const db = this.database.db;
    const [updated] = await db
      .update(adminNotifications)
      .set({ read: true })
      .where(eq(adminNotifications.id, id))
      .returning();
    if (!updated) throw new AppError(404, 'Notification not found.', 'NOT_FOUND');
    return {
      id: updated.id,
      type: updated.type,
      title: updated.title,
      text: updated.message,
      message: updated.message,
      link: updated.link,
      unread: !updated.read,
      read: updated.read,
      time: this.formatRelativeTime(updated.createdAt),
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async markAllAdminNotificationsRead() {
    const db = this.database.db;
    await db.update(adminNotifications).set({ read: true });
    return { success: true };
  }

  private formatRelativeTime(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

