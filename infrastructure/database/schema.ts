import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  account,
  accountRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from './auth-schema.js';

const appTimestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const appUsers = pgTable(
  'app_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    emailNormalized: text('email_normalized').notNull(),
    fullName: text('full_name'),
    phone: text('phone'),
    graduationYear: text('graduation_year'),
    department: text('department'),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    status: text('status').notNull().default('active'),
    ...appTimestamps,
  },
  (table) => [
    uniqueIndex('app_users_email_normalized_uidx').on(table.emailNormalized),
    check(
      'app_users_status_check',
      sql`${table.status} in ('active', 'suspended', 'pending', 'disabled')`
    ),
  ]
);

export const authIdentities = pgTable(
  'auth_identities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'cascade' }),
    issuer: text('issuer').notNull(),
    subject: text('subject').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    ...appTimestamps,
  },
  (table) => [
    uniqueIndex('auth_identities_issuer_subject_uidx').on(table.issuer, table.subject),
    index('auth_identities_user_id_idx').on(table.userId),
  ]
);

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    systemManaged: boolean('system_managed').notNull().default(false),
    ...appTimestamps,
  },
  (table) => [uniqueIndex('roles_code_uidx').on(table.code)]
);

export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('permissions_code_uidx').on(table.code)]
);

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => appUsers.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    assignedBy: uuid('assigned_by').references(() => appUsers.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ name: 'user_roles_pk', columns: [table.userId, table.roleId] }),
    index('user_roles_role_id_user_id_idx').on(table.roleId, table.userId),
  ]
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      name: 'role_permissions_pk',
      columns: [table.roleId, table.permissionId],
    }),
    index('role_permissions_permission_id_role_id_idx').on(
      table.permissionId,
      table.roleId
    ),
  ]
);

export const events = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull().default(''),
    description: text('description').notNull().default(''),
    longDescription: text('long_description').notNull().default(''),
    startDate: date('start_date', { mode: 'string' }).notNull(),
    endDate: date('end_date', { mode: 'string' }),
    time: text('time').notNull().default(''),
    venue: text('venue').notNull(),
    city: text('city').notNull().default(''),
    category: text('category').notNull(),
    poster: text('poster').notNull().default(''),
    banner: text('banner').notNull().default(''),
    gallery: jsonb('gallery').$type<string[]>().notNull().default([]),
    schedule: jsonb('schedule')
      .$type<Array<{ time: string; title: string; detail: string }>>()
      .notNull()
      .default([]),
    organizer: text('organizer').notNull().default(''),
    organizerRole: text('organizer_role').notNull().default(''),
    organizerPhoto: text('organizer_photo').notNull().default(''),
    capacity: integer('capacity').notNull(),
    registered: integer('registered').notNull().default(0),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    status: text('status').notNull().default('draft'),
    featured: boolean('featured').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('events_slug_uidx').on(table.slug),
    index('events_status_start_date_idx').on(table.status, table.startDate),
    index('events_featured_status_idx').on(table.featured, table.status),
    check('events_status_check', sql`${table.status} in ('draft', 'published', 'scheduled', 'archived')`),
    check('events_capacity_check', sql`${table.capacity} > 0`),
    check('events_registered_check', sql`${table.registered} >= 0 and ${table.registered} <= ${table.capacity}`),
    check('events_end_date_check', sql`${table.endDate} is null or ${table.endDate} >= ${table.startDate}`),
  ]
);

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    emailNormalized: text('email_normalized').notNull(),
    roleCode: text('role_code').notNull().default('alumni'),
    token: text('token').notNull(),
    status: text('status').notNull().default('pending'),
    invitedBy: uuid('invited_by').references(() => appUsers.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('invitations_token_uidx').on(table.token),
    index('invitations_email_normalized_idx').on(table.emailNormalized),
    check('invitations_status_check', sql`${table.status} in ('pending', 'accepted', 'revoked', 'expired')`),
  ]
);

export const elections = pgTable(
  'elections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    isActive: boolean('is_active').notNull().default(false),
    resultsPublished: boolean('results_published').notNull().default(false),
    ...appTimestamps,
  },
  (table) => [
    index('elections_active_dates_idx').on(table.isActive, table.startDate, table.endDate),
    check('elections_dates_check', sql`${table.endDate} >= ${table.startDate}`),
  ]
);

export const positions = pgTable(
  'positions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    electionId: uuid('election_id')
      .notNull()
      .references(() => elections.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...appTimestamps,
  },
  (table) => [
    index('positions_election_id_sort_order_idx').on(table.electionId, table.sortOrder),
  ]
);

export const candidates = pgTable(
  'candidates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    positionId: uuid('position_id')
      .notNull()
      .references(() => positions.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    graduationYear: integer('graduation_year'),
    department: text('department'),
    biography: text('biography'),
    manifesto: text('manifesto'),
    photoUrl: text('photo_url'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...appTimestamps,
  },
  (table) => [
    index('candidates_position_id_sort_order_idx').on(table.positionId, table.sortOrder),
  ]
);

export const votes = pgTable(
  'votes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    electionId: uuid('election_id')
      .notNull()
      .references(() => elections.id, { onDelete: 'cascade' }),
    positionId: uuid('position_id')
      .notNull()
      .references(() => positions.id, { onDelete: 'cascade' }),
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => candidates.id, { onDelete: 'cascade' }),
    voterHash: text('voter_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('votes_election_position_voter_uidx').on(
      table.electionId,
      table.positionId,
      table.voterHash
    ),
    index('votes_candidate_id_idx').on(table.candidateId),
  ]
);

export const electionVoters = pgTable(
  'election_voters',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    electionId: uuid('election_id')
      .notNull()
      .references(() => elections.id, { onDelete: 'cascade' }),
    voterHash: text('voter_hash').notNull(),
    voterEmailNormalized: text('voter_email_normalized'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('election_voters_election_voter_uidx').on(table.electionId, table.voterHash),
  ]
);

export const voterOtpRequests = pgTable(
  'voter_otp_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    electionId: uuid('election_id')
      .notNull()
      .references(() => elections.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    emailNormalized: text('email_normalized').notNull(),
    phone: text('phone').notNull(),
    graduationYear: text('graduation_year').notNull(),
    otpHash: text('otp_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    verified: boolean('verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('voter_otp_requests_election_email_idx').on(table.electionId, table.emailNormalized),
  ]
);

export const eventRegistrations = pgTable(
  'event_registrations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => appUsers.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    emailNormalized: text('email_normalized').notNull(),
    phone: text('phone'),
    graduationYear: text('graduation_year'),
    status: text('status').notNull().default('confirmed'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('event_registrations_event_email_uidx').on(table.eventId, table.emailNormalized),
    index('event_registrations_event_id_idx').on(table.eventId),
    index('event_registrations_user_id_idx').on(table.userId),
  ]
);

export const astecSchema = {
  appUsers,
  authIdentities,
  roles,
  permissions,
  userRoles,
  rolePermissions,
  events,
  invitations,
  elections,
  positions,
  candidates,
  votes,
  electionVoters,
  voterOtpRequests,
  eventRegistrations,
  user,
  session,
  account,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
};
