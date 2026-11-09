import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  appUsers,
  authIdentities,
  permissions,
  rolePermissions,
  roles,
  userRoles,
  galleryItems,
  timelineMilestones,
  communityMessages,
  stories,
  announcements,
  siteContent,
} from '@astec/database';
import { DatabaseService } from './database.service.js';
import { AuthService } from '../auth/auth.service.js';

export const STANDARD_PERMISSIONS = [
  { code: 'users:read', description: 'View member and user directories' },
  { code: 'users:write', description: 'Manage, approve, or suspend users' },
  { code: 'roles:read', description: 'View roles and permission assignments' },
  { code: 'roles:write', description: 'Create or modify roles and permissions' },
  { code: 'events:read', description: 'View events in administrative panels' },
  { code: 'events:write', description: 'Create, update, or delete events' },
  { code: 'elections:read', description: 'View elections, candidates, and tallies' },
  { code: 'elections:write', description: 'Create and manage elections and candidates' },
  { code: 'gallery:write', description: 'Upload and manage media gallery' },
  { code: 'stories:write', description: 'Create and publish stories and articles' },
  { code: 'comments:write', description: 'Approve or moderate wall comments' },
  { code: 'announcements:write', description: 'Publish official association announcements' },
  { code: 'settings:write', description: 'Manage platform configurations' },
];

export const STANDARD_ROLES = [
  {
    code: 'super_admin',
    name: 'Super Administrator',
    description: 'Full administrative access and authority',
    systemManaged: true,
    permissionCodes: STANDARD_PERMISSIONS.map((p) => p.code),
  },
  {
    code: 'admin',
    name: 'Administrator',
    description: 'General administrative operations and approvals',
    systemManaged: true,
    permissionCodes: [
      'users:read',
      'users:write',
      'roles:read',
      'events:read',
      'events:write',
      'elections:read',
      'elections:write',
      'gallery:write',
      'stories:write',
      'comments:write',
      'announcements:write',
    ],
  },
  {
    code: 'content_manager',
    name: 'Content Manager',
    description: 'Manage stories, announcements, and media content',
    systemManaged: false,
    permissionCodes: ['gallery:write', 'stories:write', 'announcements:write', 'comments:write'],
  },
  {
    code: 'event_manager',
    name: 'Event Manager',
    description: 'Manage events, attendees, and scheduling',
    systemManaged: false,
    permissionCodes: ['events:read', 'events:write'],
  },
  {
    code: 'community_moderator',
    name: 'Community Moderator',
    description: 'Moderate comments and user interactions',
    systemManaged: false,
    permissionCodes: ['comments:write', 'stories:write'],
  },
  {
    code: 'gallery_manager',
    name: 'Gallery Manager',
    description: 'Curate and organize alumni photo galleries',
    systemManaged: false,
    permissionCodes: ['gallery:write'],
  },
  {
    code: 'editor',
    name: 'Editor',
    description: 'Draft and review news articles and newsletters',
    systemManaged: false,
    permissionCodes: ['stories:write'],
  },
  {
    code: 'membership_manager',
    name: 'Membership Manager',
    description: 'Review alumni registrations and membership records',
    systemManaged: false,
    permissionCodes: ['users:read', 'users:write'],
  },
  {
    code: 'alumni',
    name: 'Alumni Member',
    description: 'Standard alumni member with voting and event access',
    systemManaged: true,
    permissionCodes: [],
  },
];

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly authService: AuthService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedPermissionsAndRoles();
    await this.provisionInitialSuperAdmin();
    await this.seedCmsContent();
  }

  async seedPermissionsAndRoles(): Promise<void> {
    const db = this.database.db;

    // 1. Seed Permissions
    const existingPerms = await db.select().from(permissions);
    const existingPermCodes = new Set(existingPerms.map((p) => p.code));

    for (const perm of STANDARD_PERMISSIONS) {
      if (!existingPermCodes.has(perm.code)) {
        await db.insert(permissions).values(perm).onConflictDoNothing();
      }
    }

    const allPerms = await db.select().from(permissions);
    const permMap = new Map<string, string>();
    for (const p of allPerms) {
      permMap.set(p.code, p.id);
    }

    // 2. Seed Roles and Role Permissions
    for (const roleDef of STANDARD_ROLES) {
      const [roleRow] = await db
        .insert(roles)
        .values({
          code: roleDef.code,
          name: roleDef.name,
          description: roleDef.description,
          systemManaged: roleDef.systemManaged,
        })
        .onConflictDoUpdate({
          target: roles.code,
          set: {
            name: roleDef.name,
            description: roleDef.description,
            systemManaged: roleDef.systemManaged,
          },
        })
        .returning({ id: roles.id });

      const roleId = roleRow?.id ?? (await db.query.roles.findFirst({ where: eq(roles.code, roleDef.code) }))?.id;
      if (!roleId) continue;

      for (const pCode of roleDef.permissionCodes) {
        const permId = permMap.get(pCode);
        if (permId) {
          await db
            .insert(rolePermissions)
            .values({ roleId, permissionId: permId })
            .onConflictDoNothing();
        }
      }
    }
  }

  async provisionInitialSuperAdmin(): Promise<void> {
    const db = this.database.db;

    // Check if a super admin already exists
    const superAdminRole = await db.query.roles.findFirst({
      where: eq(roles.code, 'super_admin'),
    });
    if (!superAdminRole) return;

    const existingSuperAdmins = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .where(eq(userRoles.roleId, superAdminRole.id))
      .limit(1);

    if (existingSuperAdmins.length > 0) {
      return;
    }

    const email = (process.env.INITIAL_SUPER_ADMIN_EMAIL || 'admin@astecaa.org').trim().toLowerCase();
    const password = process.env.INITIAL_SUPER_ADMIN_PASSWORD || 'AdminAstec2026!';
    const name = process.env.INITIAL_SUPER_ADMIN_NAME || 'ASTECAA Super Admin';

    try {
      this.logger.log(`Provisioning initial Super Admin account (${email})...`);
      const authUser = await this.authService.auth.api.signUpEmail({
        body: { email, password, name },
      });

      if (authUser?.user) {
        const principal = await db.query.appUsers.findFirst({
          where: eq(appUsers.emailNormalized, email),
        });

        if (principal) {
          await db
            .insert(userRoles)
            .values({ userId: principal.id, roleId: superAdminRole.id })
            .onConflictDoNothing();

          this.logger.log(`Initial Super Admin provisioned successfully: ${email}`);
        }
      }
    } catch (err: any) {
      // If user already exists in auth table, ensure super_admin role assignment
      const principal = await db.query.appUsers.findFirst({
        where: eq(appUsers.emailNormalized, email),
      });
      if (principal) {
        await db
          .insert(userRoles)
          .values({ userId: principal.id, roleId: superAdminRole.id })
          .onConflictDoNothing();
        this.logger.log(`Assigned super_admin role to existing user: ${email}`);
      } else {
        this.logger.warn(`Could not provision super admin: ${err?.message || err}`);
      }
    }
  }

  async seedCmsContent(): Promise<void> {
    const db = this.database.db;

    // 1. Seed Gallery Items if empty
    const existingGallery = await db.select().from(galleryItems).limit(1);
    if (existingGallery.length === 0) {
      this.logger.log('Seeding initial gallery memories...');
      const initialMemories = [
        { title: 'The Beginning of ASTECAA', year: 1998, url: '/images/harvest-table.jpg', description: 'The beginning of a new chapter for former students', album: 'ASTECAA History', mediaType: 'photo', featured: true },
        { title: 'Our First Alumni Gathering', year: 1999, url: '/images/concert.jpg', description: 'Former students coming together for the first alumni gathering', album: 'Reunions', mediaType: 'photo', featured: true },
        { title: 'Building the Alumni Family', year: 2002, url: '/images/fiddle-circle.jpg', description: 'Alumni strengthening friendships and building the association', album: 'Conventions', mediaType: 'photo', featured: false },
        { title: 'Remembering Where We Started', year: 2005, url: '/images/voices-oral-history.jpg', description: 'Alumni sharing memories of their school days', album: 'Alumni Stories', mediaType: 'photo', featured: true },
        { title: 'A Growing Alumni Network', year: 2008, url: '/images/reunion.jpg', description: 'ASTECAA members gathering as the association continued to grow', album: 'ASTECAA History', mediaType: 'photo', featured: false },
        { title: 'Stronger Together', year: 2011, url: '/images/lantern-procession.jpg', description: 'Alumni united in fellowship and service', album: 'Conventions', mediaType: 'photo', featured: false },
        { title: 'Celebrating Our Alumni', year: 2014, url: '/images/market-stalls.jpg', description: 'Celebrating the achievements and contributions of ASTECAA members', album: 'Alumni Celebrations', mediaType: 'photo', featured: false },
        { title: 'Years of Friendship', year: 2017, url: '/images/ASTECAA.jpg', description: 'Old classmates reunited and making new memories', album: 'Class Reunions', mediaType: 'photo', featured: true },
        { title: 'Passing the Legacy Forward', year: 2019, url: '/images/tea-stories.jpg', description: 'Alumni sharing experiences and inspiring the next generation', album: 'Alumni Stories', mediaType: 'photo', featured: false },
        { title: 'A New Generation of Alumni', year: 2021, url: '/images/square-at-dusk.jpg', description: 'Staying connected and keeping the ASTECAA family together', album: 'ASTECAA History', mediaType: 'video', featured: false },
        { title: 'Together Again', year: 2023, url: '/images/open-fire-feast.jpg', description: 'Alumni reconnecting through fellowship, celebration, and service', album: 'Conventions', mediaType: 'photo', featured: false },
        { title: 'The ASTECAA Legacy Continues', year: 2026, url: '/images/reading-room.jpg', description: 'Celebrating our journey and looking ahead to the future', album: 'ASTECAA History', mediaType: 'photo', featured: true },
      ];
      for (const m of initialMemories) {
        await db.insert(galleryItems).values(m).onConflictDoNothing();
      }
    }

    // 2. Seed Timeline Milestones if empty
    const existingTimeline = await db.select().from(timelineMilestones).limit(1);
    if (existingTimeline.length === 0) {
      this.logger.log('Seeding initial timeline milestones...');
      const initialMilestones = [
        { year: 1993, title: 'The Foundation in Owerrinta', story: 'Adventist Secondary Technical College (ASTEC) officially opens its doors in Abia State, Nigeria. A pioneer group of students and passionate educators gather to begin a legacy built on technical skill and spiritual values.', imageUrl: '/images/ASTECAA.jpg', quote: 'We set out to build not just a school, but a foundational sanctuary for character and competence.', quoteAuthor: 'Pioneer Principal Statement, 1993', sortOrder: 1 },
        { year: 1998, title: 'The Inaugural Graduation', story: 'History is made as the very first set of ASTECians completes their final secondary school certificates. This pioneer set steps out into the world, laying the first structural bricks of what would become our global alumni network.', imageUrl: '/images/reunion.jpg', quote: 'We were the first fruits of a great vision, paving the way for thousands to follow.', quoteAuthor: 'Class of 1998 Representative', sortOrder: 2 },
        { year: 2004, title: 'Expanding the Technical Workshops', story: 'To support growing enrollment, the campus introduces upgraded technical and science laboratories. The alumni network steps in formally for the first time to help mentor students entering engineering and sciences.', imageUrl: '/images/concert.jpg', sortOrder: 3 },
        { year: 2010, title: 'The Digital Alumni Hub', story: 'With the rise of social networks, various graduating classes—spearheaded by the highly active Class of 2010—organize formal digital chapters, reconnecting hundreds of long-lost classmates across continents.', imageUrl: '/images/market-stalls.jpg', sortOrder: 4 },
        { year: 2015, title: 'The Lavatory Infrastructure Project', story: 'ASTECAA chapters coordinate a major community development project on campus. The association funds and commissions an ultra-modern lavatory facility to significantly improve student health and well-being.', imageUrl: '/images/voices-oral-history.jpg', quote: 'Giving back to the place that shaped us is not an option; it is our lifelong responsibility.', quoteAuthor: 'ASTECAA Project Committee Lead', sortOrder: 5 },
        { year: 2018, title: 'Global Chapters Formalized', story: 'Alumni bases solidify regional chapters across Nigeria, the United Kingdom, and North America. Cross-generational networking and corporate mentorship programs become an official backbone of the association.', imageUrl: '/images/reading-room.jpg', sortOrder: 6 },
        { year: 2023, title: 'The Silver Jubilee Era', story: 'Celebrating over 25 years since the pioneer set graduated, ASTECAA returns to Owerrinta for massive landmark homecoming ceremonies, funding new scholarship programs for outstanding technical students.', imageUrl: '/images/lantern-procession.jpg', sortOrder: 7 },
        { year: 2026, title: 'The Living Archive Portal', story: 'The ASTECAA dynamic portal goes live globally. Decades of school records, graduation photographs, professional milestone listings, and historical campus memories are preserved in one central digital home.', imageUrl: '/images/tea-stories.jpg', sortOrder: 8 },
      ];
      for (const tm of initialMilestones) {
        await db.insert(timelineMilestones).values(tm).onConflictDoNothing();
      }
    }

    // 3. Seed Community Messages if empty
    const existingCommunity = await db.select().from(communityMessages).limit(1);
    if (existingCommunity.length === 0) {
      this.logger.log('Seeding initial community messages...');
      const initialMessages = [
        { author: 'Chinedu Okafor', email: 'chinedu@astecaa.org', location: 'Lagos, Nigeria', avatar: '/images/avatar-chinedu.jpg', message: 'My years at ASTECAA taught me more than academics. The discipline, friendships, and values I gained there have continued to guide me throughout my career. Being part of ASTECAA again reminds me where so much of my journey began.', likes: 142, pinned: true },
        { author: 'Grace Nwankwo', email: 'grace@astecaa.org', location: 'Abuja, Nigeria', avatar: '/images/avatar-grace.jpg', message: 'I graduated many years ago, but reconnecting with former classmates through ASTECAA made it feel like we had never been apart. There is something special about meeting people who shared the same classrooms, teachers, and memories.', likes: 89, pinned: false },
        { author: 'Emmanuel Adeyemi', email: 'emmanuel@astecaa.org', location: 'Ibadan, Nigeria', avatar: '/images/avatar-emmanuel.jpg', message: 'ASTECAA has shown me that an alumni association is more than a network. It is a community where we can support one another, celebrate our achievements, and give back to the institution that helped shape us.', likes: 211, pinned: false },
        { author: 'Esther Chukwu', email: 'esther@astecaa.org', location: 'Port Harcourt, Nigeria', avatar: '/images/avatar-esther.jpg', message: 'One of my fondest memories of ASTECAA is the sense of family among students and teachers. Years later, those friendships remain strong. Reconnecting with fellow alumni has brought back memories I thought I had forgotten.', likes: 67, pinned: false },
        { author: 'Samuel Eze', email: 'samuel@astecaa.org', location: 'Enugu, Nigeria', avatar: '/images/avatar-samuel.jpg', message: 'I never imagined that a school photograph from my graduating year would bring back so many memories. Seeing familiar faces again reminded me of how far we have all come and how important it is to keep these connections alive.', likes: 158, pinned: false },
      ];
      for (const cm of initialMessages) {
        await db.insert(communityMessages).values(cm).onConflictDoNothing();
      }
    }

    // 4. Seed Stories if empty
    const existingStories = await db.select().from(stories).limit(1);
    if (existingStories.length === 0) {
      this.logger.log('Seeding initial stories...');
      const initialStories = [
        { slug: 'from-astec-to-the-world', title: 'From ASTEC to the World', excerpt: 'Across different graduating sets, ASTECAA alumni have built careers, businesses, and communities while carrying the values of their school with them.', body: 'Across different graduating sets, ASTECAA alumni have built careers, businesses, and communities while carrying the values of their school with them. In every sector from technology to medicine, ASTECians continue to lead with excellence and integrity.', author: 'Daniel Okonkwo', authorAvatar: '/images/avatar-daniel.jpg', category: 'Alumni Journey', cover: '/images/ASTECAA.jpg', views: 2841 },
        { slug: 'the-memories-we-still-carry', title: 'The Memories We Still Carry', excerpt: 'Old classrooms, familiar faces, school assemblies, friendships, and the moments that made our years at ASTEC unforgettable.', body: 'Old classrooms, familiar faces, school assemblies, friendships, and the moments that made our years at ASTEC unforgettable. We look back with immense gratitude for the teachers and mentors who invested in us.', author: 'Daniel Okonkwo', authorAvatar: '/images/avatar-daniel.jpg', category: 'Memories', cover: '/images/reading-room.jpg', views: 1923 },
        { slug: 'why-astecaa-still-matters', title: 'Why ASTECAA Still Matters', excerpt: 'Years after graduation, the alumni bond continues to create opportunities for connection, mentorship, support, and meaningful contribution.', body: 'Years after graduation, the alumni bond continues to create opportunities for connection, mentorship, support, and meaningful contribution to the next generation of students.', author: 'Chinedu Okafor', authorAvatar: '/images/avatar-daniel.jpg', category: 'Community', cover: '/images/harvest-table.jpg', views: 3672 },
      ];
      for (const st of initialStories) {
        await db.insert(stories).values(st).onConflictDoNothing();
      }
    }

    // 5. Seed Announcements if empty
    const existingAnnouncements = await db.select().from(announcements).limit(1);
    if (existingAnnouncements.length === 0) {
      this.logger.log('Seeding initial announcements...');
      await db.insert(announcements).values({
        title: 'ASTECAA Annual Alumni Reunion 2026 registration is open',
        body: 'Registration for the ASTECAA Annual Alumni Reunion 2026 is now open. Join fellow alumni for a weekend of reconnection, networking, recognition, celebration, and fellowship at the ASTEC Campus on December 19–20, 2026.',
        date: '2026-09-01',
        status: 'published',
        pinned: true,
        channel: 'site',
      }).onConflictDoNothing();
    }

    // 6. Seed Homepage Content if empty
    const existingHomepage = await db.query.siteContent.findFirst({
      where: eq(siteContent.id, 'homepage'),
    });
    if (!existingHomepage) {
      this.logger.log('Seeding initial homepage site content...');
      await db.insert(siteContent).values({
        id: 'homepage',
        content: {
          heroHeadline: 'Reconnect. Celebrate. Give Back.',
          heroSubheadline: 'The official digital home of ASTECAA alumni — connecting former students, celebrating our shared journey, and building a stronger future together.',
          heroTagline: 'ASTECAA · Alumni Association',
          heroPrimaryBtn: 'Explore Upcoming Events',
          heroSecondaryBtn: 'Discover ASTECAA',
          stats: [
            { label: 'Active Chapters', value: 8 },
            { label: 'Graduating Sets', value: 26 },
            { label: 'Registered Alumni', value: '1,200+' },
            { label: 'Projects Completed', value: 15 },
          ],
        },
      }).onConflictDoNothing();
    }
  }
}

