# Architecture

## Current boundaries

The website and admin are separate Angular applications, each with its own
bootstrap, routes, and build target. They share UI components, domain types,
API clients, and voting data-access modules. `apps/api` is an independent Deno
service using Better Auth and Neon PostgreSQL.

Events use Neon-backed public reads and admin CRUD. Most other public pages and
CMS flows remain fixture-backed or in-memory; these are not replaced by the
event slice. Supabase source data and accounts have not been verified as
migrated, so the external project must remain available.

## Dependency direction

- Applications may depend on `packages/*`.
- `apps/api` may depend on shared types and validation, but not on Angular apps.
- Shared packages must not import from an application.
- Database schema and policies belong under `infrastructure/database`.
- Public browser code must never contain database, auth, storage, or email
  service credentials.

## API feature layout

Add endpoints in `apps/api/src/modules`, business rules in `services`, data
access in `repositories`, and request validation at the HTTP boundary. Use the
authentication and role middleware in addition to database Row Level Security;
frontend route guards are not an authorization boundary.
