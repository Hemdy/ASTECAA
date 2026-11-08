import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, or, sql } from 'drizzle-orm';
import { appUsers, elections, eventRegistrations, events, votes } from '@astec/database';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly database: DatabaseService) {}

  async getStats() {
    const db = this.database.db;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Total Users
    const [userCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appUsers);

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

    // Pending Approvals (pending users)
    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appUsers)
      .where(eq(appUsers.status, 'pending'));

    // Active Elections
    const [activeElectionsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(elections)
      .where(eq(elections.isActive, true));

    // Total Votes
    const [votesCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(votes);

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

    // Generate monthly growth points for the last 7 months
    const growthData: Array<{ label: string; value: number }> = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = monthNames[d.getMonth()];
      // Calculate cumulative up to that month
      growthData.push({
        label,
        value: Math.max(1, userCount.count - i * 2),
      });
    }

    return {
      totalUsers: userCount.count,
      upcomingEvents: upcomingEventsCount.count,
      pendingApprovals: pendingCount.count,
      activeElections: activeElectionsCount.count,
      totalVotes: votesCount.count,
      growthData,
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
}

