# Migrations

## CONCURRENTLY Workaround

Prisma cannot execute `CREATE INDEX CONCURRENTLY` inside its transactional
wrapper — running `npx prisma migrate dev` will fail on migrations that use
CONCURRENTLY indexes.

For migrations containing `CREATE INDEX CONCURRENTLY` (e.g.
`20260701201531_add_deleted_at`):

1. Apply the SQL manually with psql:
   ```bash
   psql "$DATABASE_URL" -f apps/backend/prisma/migrations/<migration>/migration.sql
   ```
2. Mark it as applied so Prisma skips it on subsequent runs:
   ```bash
   cd apps/backend && npx prisma migrate resolve --applied <migration_name>
   ```
3. Do NOT run `npx prisma migrate dev` until the migration is resolved.

This pattern is used for the soft-delete indexes (`deletedAt` columns) so that
adding the indexes does not block writes on tables that are already populated.