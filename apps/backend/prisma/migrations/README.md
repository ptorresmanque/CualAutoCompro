# Migrations

Este proyecto corre sobre **MariaDB 10.5+** con Prisma ORM. El provider en
`migration_lock.toml` está fijado a `mysql`.

```bash
# aplicar migraciones pendientes (producción / CI)
cd apps/backend && npx prisma migrate deploy

# desarrollo: crear/aplicar migración y regenerar cliente
npm run db:migrate
```

## Notas

- MariaDB no soporta `CREATE INDEX CONCURRENTLY` (eso es PostgreSQL), por lo que no
  se necesita el workaround que se usaba cuando el backend corría sobre Postgres.
- Todas las migraciones deben ser idempotentes al aplicar con `migrate deploy`
  desde una base limpia. El charset `utf8mb4` y el collation `utf8mb4_unicode_ci`
  ya están fijados en `migration_lock.toml` y se respetan al generar SQL.
