# Database configuration

This directory is reserved for non-secret database configuration. Runtime and
migration connection URLs belong in ignored local environment files or an
approved deployment secret manager. Do not store credentials here.

The API uses Neon for its current database-backed functionality. The external
Supabase project remains untouched pending a separately authorized and
verified data/account migration.
