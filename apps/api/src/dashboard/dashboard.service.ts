import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, or, sql } from 'drizzle-orm';
import {
  appUsers,
  elections,
  eventRegistrations,
  events,
  votes,
  communityMessages,
  communityReplies,
  communityReactions,
  contactSubmissions,
  session,
} from '@astec/database';
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

    // Recent 4 users
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
      .limit(4);

    // Recent 4 upcoming events
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
      .limit(4);

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

    // Recent real activities
    const [latestRegistrations, latestMessages, latestUsers] = await Promise.all([
      db
        .select({
          id: eventRegistrations.id,
          name: eventRegistrations.name,
          createdAt: eventRegistrations.createdAt,
          eventTitle: events.title,
        })
        .from(eventRegistrations)
        .innerJoin(events, eq(eventRegistrations.eventId, events.id))
        .orderBy(desc(eventRegistrations.createdAt))
        .limit(3),
      db
        .select({
          id: communityMessages.id,
          author: communityMessages.author,
          page: communityMessages.page,
          createdAt: communityMessages.createdAt,
        })
        .from(communityMessages)
        .orderBy(desc(communityMessages.createdAt))
        .limit(3),
      db
        .select({
          id: appUsers.id,
          name: appUsers.fullName,
          createdAt: appUsers.createdAt,
        })
        .from(appUsers)
        .orderBy(desc(appUsers.createdAt))
        .limit(3),
    ]);

    const activityList: Array<{
      id: string;
      user: string;
      action: string;
      target: string;
      time: string;
      icon: string;
      timestamp: number;
    }> = [];

    for (const reg of latestRegistrations) {
      activityList.push({
        id: `reg_${reg.id}`,
        user: reg.name,
        action: 'registered for',
        target: reg.eventTitle,
        time: this.formatRelativeTime(reg.createdAt),
        icon: 'ri-calendar-check-line',
        timestamp: reg.createdAt.getTime(),
      });
    }

    for (const msg of latestMessages) {
      activityList.push({
        id: `msg_${msg.id}`,
        user: msg.author,
        action: 'posted a note on',
        target: msg.page === 'community' ? 'Community Wall' : msg.page,
        time: this.formatRelativeTime(msg.createdAt),
        icon: 'ri-chat-voice-line',
        timestamp: msg.createdAt.getTime(),
      });
    }

    for (const u of latestUsers) {
      activityList.push({
        id: `usr_${u.id}`,
        user: u.name || 'Alumnus',
        action: 'joined as a verified member of',
        target: 'ASTECAA',
        time: this.formatRelativeTime(u.createdAt),
        icon: 'ri-user-add-line',
        timestamp: u.createdAt.getTime(),
      });
    }

    activityList.sort((a, b) => b.timestamp - a.timestamp);

    // Pending approvals list from database
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
      .limit(4);

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

  private formatRelativeTime(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

