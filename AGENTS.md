# AGENTS.md — cualAutoCompro

Convenciones para agentes (Codex CLI / Codex app) que trabajan en este repo.
Lee este archivo **antes de empezar cualquier tarea**. Su scope es todo el
repo. AGENTS.md más específicos (ej. `apps/frontend/AGENTS.md`) lo
complementan y tienen precedencia dentro de su scope.

## 1. Inicio de tarea — checklist obligatorio

Antes de tocar código, en este orden:

1. **Releer este `AGENTS.md`** y los `AGENTS.md` de los subdirectorios que
   vayas a modificar (ej. `apps/frontend/AGENTS.md` si vas a tocar UI). El
   system prompt puede inyectar copias desactualizadas; el archivo en disco
   es la fuente de verdad.
2. **Localizar el conocimiento existente**: revisar `docs/superpowers/specs/`
   (decisiones de diseño) y `docs/superpowers/plans/` (planes previos) para
   no contradecir lo ya acordado.
3. **Indexar el repo en el knowledge graph MCP** si no está indexado
   (`index_repository`), y usar `search_graph` / `trace_path` /
   `get_code_snippet` antes que `grep` / `cat` / `sed` para descubrimiento
   de código. Caer a grep solo para strings literales, configs y
   archivos no-code.
4. **Identificar tests/correlatos**: cualquier cambio en código de
   producción debe venir con actualización de los `.spec.ts` /
   fixtures que lo cubrían.

## 2. Modo Plan

Cuando la conversación arranca en **Plan Mode** (colaboration_mode = Plan):

- **Sub-skill obligatoria: `superpowers:writing-plans`** (o la que indique
  el spec si existe). Esto aplica a:
  - Planning de features nuevas
  - Refactors con impacto cross-package
  - Cambios de schema (Prisma) o de contrato de API
- El output debe terminar en un `<proposed_plan>` que sea **decision
  complete**: el implementer no debe tener que tomar decisiones.
- Si hay ambigüedad que no se resuelve explorando, usar
  `request_user_input` antes de cerrar el plan.
- **No** aplicar mutaciones durante Plan Mode (no patches, no
  `prisma migrate dev`, no formateo). Solo lectura, búsqueda, dry-runs.

## 3. Reglas del repo (no negociables)

- **Versiones de deps exactas** en `package.json` (sin `^` salvo donde el
  spec lo pida).
- **Backend TypeScript**: imports con **`.js`** (ESM). Errores tipados vía
  `AppError` en `shared/errors.ts`.
- **Frontend**: componentes **standalone**, **OnPush**, **signals** para
  estado local. Design system en `apps/frontend/AGENTS.md` es ley.
- **DB**: cambios de schema requieren **migración Prisma** con nombre
  `YYYYMMDDHHMMSS_<slug>/` y SQL backward-compatible siempre que se pueda.
  Si la migración es destructiva, documentarlo explícitamente en el plan.
- **Tests**: backend `vitest run`, frontend `ng test`. Cobertura nueva
  junto al código que cambia (no dejar specs rotos).
- **No commitear** nada sin pedido explícito del usuario.

## 4. MCPs disponibles (cargan al inicio de sesión)

Codex carga MCPs declarados en `~/.codex/config.toml`. En este proyecto hay
tres relevantes. Si abrís una sesión nueva y no ves sus tools, revisá la
config global.

- **`codebase-memory-mcp`** — knowledge graph estructural del repo
  (`search_graph`, `trace_path`, `get_code_snippet`, `query_graph`,
  `get_architecture`, `search_code`). **Primera acción al explorar código**:
  correr `index_repository` si no está indexado. Ver root AGENTS §1.
- **`context7`** — docs de librerías (`resolve-library-id` +
  `query_docs`). Usar para validar APIs de Angular 22, Prisma, Express, etc.
- **`angular-cli`** (configurado en este repo, `--read-only`) — tools de
  Angular: `get_best_practices` (guía de standalone/typed forms/OnPush),
  `search_documentation` (angular.dev), `list_projects`, `onpush_zoneless_migration`
  (plan, no muta), `ai_tutor`. Si necesitás `devserver.*` o `run_target`,
  sacale el `--read-only` del bloque `[mcp_servers.angular-cli]` en
  `~/.codex/config.toml`.
- **`Prisma`** (server remoto `https://mcp.prisma.io/mcp`) — tools para
  Prisma Postgres managed. **Limitación importante**: las tools que tocan
  una DB (`IntrospectSchemaTool`, `ExecuteSqlQueryTool`,
  `CreateBackupTool`, `CreateRecoveryTool`, `CreateConnectionStringTool`,
  `DeleteConnectionStringTool`, `DeleteDatabaseTool`,
  `ListBackupsTool`, `ListConnectionStringsTool`, `ListDatabasesTool`)
  son específicas de **Prisma Postgres**, no de MariaDB. Este proyecto
  corre MariaDB (local + cPanel), así que esas tools **no deben
  invocarse**. La única tool útil acá es `search_prisma_documentation`
  (consultas a la doc oficial de Prisma ORM).

Para trabajo en `apps/frontend/`, preferí siempre `angular-cli` sobre
adivinar APIs de Angular 22 (signals, control flow moderno, OnPush).
Para consultas sobre el ORM (migrations, schema, Prisma Client), usá
`Prisma.search_prisma_documentation`.

## 5. Comandos útiles

```bash
# Backend
npm -w apps/backend run dev
npm -w apps/backend run test
npm -w apps/backend run db:migrate    # dev (genera + aplica)
npx prisma migrate deploy             # prod (solo aplica pendientes)

# Frontend
npm -w apps/frontend run start
npm -w apps/frontend run test
npm -w apps/frontend run check:design # linter del design system
npm -w apps/frontend run build
```

## 6. Estructura de docs

```
docs/
  setup.md                            # setup local + troubleshooting
  superpowers/
    specs/<date>-<slug>-design.md     # decisiones de diseño
    plans/<date>-<slug>.md            # planes de implementación
    design/                           # mockups + estado de Stitch
.superpowers/sdd/progress.md          # ledger de progreso por feature
```

Tras cerrar una tarea, si el plan vive en `docs/superpowers/plans/`,
apuntar el commit range en `.superpowers/sdd/progress.md` siguiendo el
formato existente (ver planes previos como referencia).
