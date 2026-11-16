import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, or, sql } from 'drizzle-orm';
import {
  announcements,
  appUsers,
  contactSubmissions,
  communityMessages,
  communityReactions,
  communityReplies,
  elections,
  eventRegistrations,
  events,
  galleryItems,
  session,
  stories,
  votes,
} from '@astec/database';
import type { AdminActivityItem } from '@astec/types';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly database: DatabaseService) {}

  async getSidebarCounts() {
    const db = this.database.db;
    const [[usersRow], [eventsRow], [commentsRow], [contactsRow]] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(appUsers),
      db.select({ count: sql<number>`count(*)::int` }).from(events),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(communityMessages)
        .where(eq(communityMessages.status, 'pending')),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(contactSubmissions)
        .where(eq(contactSubmissions.status, 'new')),
    ]);

    return {
      users: usersRow?.count ?? 0,
      events: eventsRow?.count ?? 0,
      pendingComments: commentsRow?.count ?? 0,
      newContacts: contactsRow?.count ?? 0,
    };
  }

  async getStats(period: string = '6m') {
    const db = this.database.db;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Total Users
    const [userCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appUsers);
    const totalUsers = userCount?.count || 0;

    // Upcoming Events
    const [upcomingEventsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(
        and(
          or(eq(events.status, 'published'), eq(events.status, 'scheduled')),
          gte(events.startDate, todayStr),
        ),
      );

    // Pending Users
    const [pendingUsersCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appUsers)
      .where(eq(appUsers.status, 'pending'));

    // Pending Comments / Notes
    const [pendingCommentsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(communityMessages)
      .where(eq(communityMessages.status, 'pending'));

    const pendingApprovals = (pendingUsersCount?.count || 0) + (pendingCommentsCount?.count || 0);

    // Active Elections
    const [activeElectionsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(elections)
      .where(eq(elections.isActive, true));

    // Total Votes
    const [votesCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(votes);

    // Engaged members calculation (users who are active in the system)
    const [activeUsersRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appUsers)
      .where(eq(appUsers.status, 'active'));

    const activeMembers = activeUsersRow?.count || 0;
    const engagedUsersCount = Math.min(totalUsers, Math.max(activeMembers, totalUsers > 0 ? 1 : 0));
    const inactiveUsersCount = Math.max(0, totalUsers - engagedUsersCount);
    const engagementRate = totalUsers > 0 ? Math.round((engagedUsersCount / totalUsers) * 100) : 100;

    // Recent 5 users
    const recentUsers = await db
      .select({
        id: appUsers.id,
        name: appUsers.fullName,
        email: appUsers.email,
        avatar: appUsers.avatarUrl,
        status: appUsers.status,
        joined: appUsers.createdAt,
      })
      .from(appUsers)
      .orderBy(desc(appUsers.createdAt))
      .limit(5);

    // Recent 5 upcoming events
    const upcomingEventsList = await db
      .select({
        id: events.id,
        title: events.title,
        date: events.startDate,
        venue: events.venue,
        category: events.category,
        status: events.status,
        registered: events.registered,
        capacity: events.capacity,
        featured: events.featured,
        poster: events.poster,
      })
      .from(events)
      .where(
        and(
          or(eq(events.status, 'published'), eq(events.status, 'scheduled')),
          gte(events.startDate, todayStr),
        ),
      )
      .orderBy(events.startDate)
      .limit(5);

    // Dynamic Community Growth Registrations based on requested period
    const growthData: Array<{ label: string; value: number }> = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (period === '2w') {
      // 14 days
      const fourteenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);
      fourteenDaysAgo.setHours(0, 0, 0, 0);

      const dailyUsers = await db
        .select({
          date: sql<string>`to_char(${appUsers.createdAt}, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(appUsers)
        .where(gte(appUsers.createdAt, fourteenDaysAgo))
        .groupBy(sql`to_char(${appUsers.createdAt}, 'YYYY-MM-DD')`);

      const dayMap = new Map<string, number>();
      for (const row of dailyUsers) {
        dayMap.set(row.date, row.count);
      }

      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        growthData.push({
          label: `${d.getDate()} ${monthNames[d.getMonth()]}`,
          value: dayMap.get(key) || 0,
        });
      }
    } else if (period === '1m') {
      // 4 weeks
      const fourWeeksAgo = new Date(now.getTime() - 28 * 86400000);
      const recentUsers = await db
        .select({
          createdAt: appUsers.createdAt,
        })
        .from(appUsers)
        .where(gte(appUsers.createdAt, fourWeeksAgo));

      for (let i = 3; i >= 0; i--) {
        const startWk = new Date(now.getTime() - (i + 1) * 7 * 86400000);
        const endWk = new Date(now.getTime() - i * 7 * 86400000);
        const count = recentUsers.filter(
          (u) => u.createdAt >= startWk && u.createdAt < endWk,
        ).length;
        growthData.push({
          label: `Wk ${4 - i}`,
          value: count,
        });
      }
    } else {
      // Monthly: 3m (3 months), 6m (6 months, default), 12m (12 months)
      let numMonths = 6;
      if (period === '12m') numMonths = 12;
      else if (period === '3m') numMonths = 3;

      const startDate = new Date(now.getFullYear(), now.getMonth() - (numMonths - 1), 1);
      const userRegistrationsByMonth = await db
        .select({
          month: sql<string>`to_char(${appUsers.createdAt}, 'YYYY-MM')`,
          count: sql<number>`count(*)::int`,
        })
        .from(appUsers)
        .where(gte(appUsers.createdAt, startDate))
        .groupBy(sql`to_char(${appUsers.createdAt}, 'YYYY-MM')`);

      const regMap = new Map<string, number>();
      for (const row of userRegistrationsByMonth) {
        regMap.set(row.month, row.count);
      }

      for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = monthNames[d.getMonth()];
        growthData.push({
          label,
          value: regMap.get(key) || 0,
        });
      }
    }

    // Real daily engagement metrics (last 7 days): community notes, replies, reactions, event registrations, votes
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [dailyMsgs, dailyReplies, dailyReactions, dailyRegs, dailyVotes] = await Promise.all([
      db
        .select({
          date: sql<string>`to_char(${communityMessages.createdAt}, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(communityMessages)
        .where(gte(communityMessages.createdAt, sevenDaysAgo))
        .groupBy(sql`to_char(${communityMessages.createdAt}, 'YYYY-MM-DD')`),
      db
        .select({
          date: sql<string>`to_char(${communityReplies.createdAt}, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(communityReplies)
        .where(gte(communityReplies.createdAt, sevenDaysAgo))
        .groupBy(sql`to_char(${communityReplies.createdAt}, 'YYYY-MM-DD')`),
      db
        .select({
          date: sql<string>`to_char(${communityReactions.createdAt}, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(communityReactions)
        .where(gte(communityReactions.createdAt, sevenDaysAgo))
        .groupBy(sql`to_char(${communityReactions.createdAt}, 'YYYY-MM-DD')`),
      db
        .select({
          date: sql<string>`to_char(${eventRegistrations.createdAt}, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(eventRegistrations)
        .where(gte(eventRegistrations.createdAt, sevenDaysAgo))
        .groupBy(sql`to_char(${eventRegistrations.createdAt}, 'YYYY-MM-DD')`),
      db
        .select({
          date: sql<string>`to_char(${votes.createdAt}, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(votes)
        .where(gte(votes.createdAt, sevenDaysAgo))
        .groupBy(sql`to_char(${votes.createdAt}, 'YYYY-MM-DD')`),
    ]);

    const dailyMap = new Map<string, number>();
    for (const group of [dailyMsgs, dailyReplies, dailyReactions, dailyRegs, dailyVotes]) {
      for (const row of group) {
        dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + row.count);
      }
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const engagementData: Array<{ label: string; value: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayLabel = dayNames[d.getDay()];
      engagementData.push({
        label: dayLabel,
        value: dailyMap.get(key) || 0,
      });
    }

    // Real platform traffic / visits from active sessions (last 6 weeks)
    const sixWeeksAgo = new Date(now.getTime() - 6 * 7 * 86400000);
    const weeklySessions = await db
      .select({
        createdAt: session.createdAt,
      })
      .from(session)
      .where(gte(session.createdAt, sixWeeksAgo));

    const trafficData: Array<{ label: string; value: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const startWk = new Date(now.getTime() - (i + 1) * 7 * 86400000);
      const endWk = new Date(now.getTime() - i * 7 * 86400000);
      const count = weeklySessions.filter(
        (s) => s.createdAt >= startWk && s.createdAt < endWk
      ).length;
      trafficData.push({
        label: `Wk ${6 - i}`,
        value: count,
      });
    }

    // Recent real activities (max 5)
    const activityList = await this.collectActivities(5);

    // Pending approvals list from database (max 5)
    const pendingCommentsList = await db
      .select({
        id: communityMessages.id,
        author: communityMessages.author,
        avatar: communityMessages.avatar,
        page: communityMessages.page,
        message: communityMessages.message,
        createdAt: communityMessages.createdAt,
      })
      .from(communityMessages)
      .where(eq(communityMessages.status, 'pending'))
      .orderBy(desc(communityMessages.createdAt))
      .limit(5);

    return {
      totalUsers,
      upcomingEvents: upcomingEventsCount.count,
      pendingApprovals,
      activeElections: activeElectionsCount.count,
      totalVotes: votesCount.count,
      engagementRate,
      engagedUsersCount,
      inactiveUsersCount,
      growthData,
      engagementData,
      trafficData,
      recentActivity: activityList.slice(0, 5),
      pendingApprovalsList: pendingCommentsList.map((c) => ({
        id: c.id,
        author: c.author,
        avatar: c.avatar || '/images/ASTECAA.jpg',
        page: c.page,
        message: c.message,
        date: c.createdAt.toISOString().slice(0, 10),
      })),
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        name: u.name || 'Alumni Member',
        email: u.email,
        avatar: u.avatar || '/images/ASTECAA.jpg',
        role: 'Alumni Member',
        status: u.status,
        joined: u.joined.toISOString().slice(0, 10),
        lastActive: 'Recently',
        events: 0,
        posts: 0,
      })),
      upcomingEventsList: upcomingEventsList.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        venue: e.venue,
        category: e.category,
        status: e.status,
        registered: e.registered,
        capacity: e.capacity,
        featured: e.featured,
        poster: e.poster,
      })),
    };
  }

  async getRecentActivity(limit = 100): Promise<AdminActivityItem[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 250);
    const perSource = Math.min(Math.max(Math.ceil(safeLimit / 2), 20), 60);
    const items = await this.collectActivities(perSource);
    return items.slice(0, safeLimit);
  }

  private async collectActivities(perSourceLimit: number): Promise<AdminActivityItem[]> {
    const db = this.database.db;
    const [
      latestRegistrations,
      latestMessages,
      latestUsers,
      latestEvents,
      latestStories,
      latestAnnouncements,
      latestContacts,
      latestGallery,
    ] = await Promise.all([
      db
        .select({
          id: eventRegistrations.id,
          name: eventRegistrations.name,
          email: eventRegistrations.emailNormalized,
          graduationYear: eventRegistrations.graduationYear,
          createdAt: eventRegistrations.createdAt,
          eventTitle: events.title,
        })
        .from(eventRegistrations)
        .innerJoin(events, eq(eventRegistrations.eventId, events.id))
        .orderBy(desc(eventRegistrations.createdAt))
        .limit(perSourceLimit),
      db
        .select({
          id: communityMessages.id,
          author: communityMessages.author,
          page: communityMessages.page,
          message: communityMessages.message,
          status: communityMessages.status,
          createdAt: communityMessages.createdAt,
        })
        .from(communityMessages)
        .orderBy(desc(communityMessages.createdAt))
        .limit(perSourceLimit),
      db
        .select({
          id: appUsers.id,
          name: appUsers.fullName,
          email: appUsers.email,
          status: appUsers.status,
          graduationYear: appUsers.graduationYear,
          createdAt: appUsers.createdAt,
        })
        .from(appUsers)
        .orderBy(desc(appUsers.createdAt))
        .limit(perSourceLimit),
      db
        .select({
          id: events.id,
          title: events.title,
          organizer: events.organizer,
          category: events.category,
          venue: events.venue,
          status: events.status,
          createdAt: events.createdAt,
        })
        .from(events)
        .orderBy(desc(events.createdAt))
        .limit(perSourceLimit),
      db
        .select({
          id: stories.id,
          title: stories.title,
          author: stories.author,
          category: stories.category,
          status: stories.status,
          createdAt: stories.createdAt,
        })
        .from(stories)
        .orderBy(desc(stories.createdAt))
        .limit(perSourceLimit),
      db
        .select({
          id: announcements.id,
          title: announcements.title,
          channel: announcements.channel,
          status: announcements.status,
          createdAt: announcements.createdAt,
        })
        .from(announcements)
        .orderBy(desc(announcements.createdAt))
        .limit(perSourceLimit),
      db
        .select({
          id: contactSubmissions.id,
          name: contactSubmissions.name,
          email: contactSubmissions.email,
          subject: contactSubmissions.subject,
          status: contactSubmissions.status,
          createdAt: contactSubmissions.createdAt,
        })
        .from(contactSubmissions)
        .orderBy(desc(contactSubmissions.createdAt))
        .limit(perSourceLimit),
      db
        .select({
          id: galleryItems.id,
          title: galleryItems.title,
          album: galleryItems.album,
          year: galleryItems.year,
          mediaType: galleryItems.mediaType,
          createdAt: galleryItems.createdAt,
        })
        .from(galleryItems)
        .orderBy(desc(galleryItems.createdAt))
        .limit(perSourceLimit),
    ]);

    const activityList: Array<AdminActivityItem & { timestamp: number }> = [];

    for (const reg of latestRegistrations) {
      const grad = reg.graduationYear ? `Class of ${reg.graduationYear}` : '';
      activityList.push({
        id: `reg_${reg.id}`,
        user: reg.name,
        action: 'registered for',
        target: reg.eventTitle,
        detail: [reg.email, grad].filter(Boolean).join(' · '),
        category: 'registration',
        time: this.formatRelativeTime(reg.createdAt),
        createdAt: reg.createdAt.toISOString(),
        icon: 'ri-calendar-check-line',
        link: '/admin/events',
        timestamp: reg.createdAt.getTime(),
      });
    }

    for (const msg of latestMessages) {
      const snippet = msg.message.length > 90 ? `${msg.message.slice(0, 90)}…` : msg.message;
      activityList.push({
        id: `msg_${msg.id}`,
        user: msg.author,
        action: 'posted a note on',
        target: msg.page === 'community' ? 'Community Wall' : msg.page,
        detail: `"${snippet}" · Status: ${msg.status}`,
        category: 'community',
        time: this.formatRelativeTime(msg.createdAt),
        createdAt: msg.createdAt.toISOString(),
        icon: 'ri-chat-voice-line',
        link: '/admin/comments',
        timestamp: msg.createdAt.getTime(),
      });
    }

    for (const u of latestUsers) {
      const grad = u.graduationYear ? `Class of ${u.graduationYear}` : '';
      activityList.push({
        id: `usr_${u.id}`,
        user: u.name || 'Alumnus',
        action: u.status === 'pending' ? 'requested membership in' : 'joined as a verified member of',
        target: 'ASTECAA',
        detail: [u.email, grad, `Status: ${u.status}`].filter(Boolean).join(' · '),
        category: 'user',
        time: this.formatRelativeTime(u.createdAt),
        createdAt: u.createdAt.toISOString(),
        icon: 'ri-user-add-line',
        link: u.status === 'pending' ? '/admin/users?status=pending' : '/admin/users',
        timestamp: u.createdAt.getTime(),
      });
    }

    for (const ev of latestEvents) {
      activityList.push({
        id: `evt_${ev.id}`,
        user: ev.organizer || 'ASTECAA Admin',
        action: ev.status === 'published' ? 'published event' : 'created event',
        target: ev.title,
        detail: `${ev.category} · ${ev.venue} · ${ev.status}`,
        category: 'event',
        time: this.formatRelativeTime(ev.createdAt),
        createdAt: ev.createdAt.toISOString(),
        icon: 'ri-calendar-event-line',
        link: '/admin/events',
        timestamp: ev.createdAt.getTime(),
      });
    }

    for (const st of latestStories) {
      activityList.push({
        id: `sty_${st.id}`,
        user: st.author || 'Editor',
        action: st.status === 'published' ? 'published story' : 'drafted story',
        target: st.title,
        detail: `${st.category} · ${st.status}`,
        category: 'story',
        time: this.formatRelativeTime(st.createdAt),
        createdAt: st.createdAt.toISOString(),
        icon: 'ri-article-line',
        link: '/admin/stories',
        timestamp: st.createdAt.getTime(),
      });
    }

    for (const ann of latestAnnouncements) {
      activityList.push({
        id: `ann_${ann.id}`,
        user: 'ASTECAA Admin',
        action: ann.status === 'published' ? 'published announcement' : 'created announcement',
        target: ann.title,
        detail: `Channel: ${ann.channel} · ${ann.status}`,
        category: 'announcement',
        time: this.formatRelativeTime(ann.createdAt),
        createdAt: ann.createdAt.toISOString(),
        icon: 'ri-notification-badge-line',
        link: '/admin/announcements',
        timestamp: ann.createdAt.getTime(),
      });
    }

    for (const ct of latestContacts) {
      activityList.push({
        id: `cnt_${ct.id}`,
        user: ct.name,
        action: 'submitted an inquiry about',
        target: ct.subject,
        detail: `${ct.email} · Status: ${ct.status}`,
        category: 'contact',
        time: this.formatRelativeTime(ct.createdAt),
        createdAt: ct.createdAt.toISOString(),
        icon: 'ri-mail-line',
        link: '/admin/contact',
        timestamp: ct.createdAt.getTime(),
      });
    }

    for (const gal of latestGallery) {
      activityList.push({
        id: `gal_${gal.id}`,
        user: 'Gallery Manager',
        action: `added ${gal.mediaType === 'video' ? 'video' : 'photo'} to`,
        target: gal.title,
        detail: `Album: ${gal.album} (${gal.year})`,
        category: 'gallery',
        time: this.formatRelativeTime(gal.createdAt),
        createdAt: gal.createdAt.toISOString(),
        icon: 'ri-image-line',
        link: '/admin/gallery',
        timestamp: gal.createdAt.getTime(),
      });
    }

    activityList.sort((a, b) => b.timestamp - a.timestamp);
    return activityList;
  }

  private formatRelativeTime(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

