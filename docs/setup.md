# Setup

Guía para levantar el entorno de desarrollo local de **cualautocompro**.

## Requisitos

- Node.js 20+
- pnpm 10+ (`npm i -g pnpm`)
- MariaDB 10.5+ (o Docker)

## Base de datos

Este proyecto usa **MariaDB 10.5+** con Prisma ORM.

### Opción A: Docker (recomendado)

```bash
docker run -d --name cualautocompro-db \
  -e MARIADB_ROOT_PASSWORD=rootpass \
  -e MARIADB_DATABASE=cualautocompro \
  -e MARIADB_USER=cualauto \
  -e MARIADB_PASSWORD=cualauto \
  -p 3306:3306 \
  mariadb:11
```

> En macOS, el cliente `mariadb` se puede instalar con `brew install mariadb` (no requiere
> el servidor). Los comandos `mariadb -ucualauto -pcualauto ...` funcionan contra el contenedor
> de Docker de esta sección.

### Opción B: Instalación local (Homebrew en macOS)

Si prefieres no usar Docker, MariaDB se puede instalar nativamente. Esto es lo que usa este
proyecto en desarrollo local.

```bash
brew install mariadb
brew services start mariadb
```

Esto levanta MariaDB 11.x escuchando en `localhost:3306`. El usuario root queda accesible
sin password en local. Para crear el usuario y las bases que usa el proyecto:

```bash
mariadb -uroot <<'SQL'
CREATE USER IF NOT EXISTS 'cualauto'@'localhost' IDENTIFIED BY 'cualauto';
GRANT ALL PRIVILEGES ON *.* TO 'cualauto'@'localhost';
FLUSH PRIVILEGES;
SQL
```

### Opción C: Instalación local (Ubuntu/Debian)

```bash
sudo apt install mariadb-server
sudo systemctl start mariadb
sudo mariadb
# dentro del cliente:
CREATE USER IF NOT EXISTS 'cualauto'@'localhost' IDENTIFIED BY 'cualauto';
GRANT ALL PRIVILEGES ON *.* TO 'cualauto'@'localhost';
FLUSH PRIVILEGES;
```

### Crear las bases de datos

```sql
CREATE DATABASE cualautocompro      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE cualautocompro_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Importante: charset utf8mb4

MariaDB debe usar `utf8mb4` para soportar emojis y caracteres Unicode completos. Esto se
aplica tanto en la URL de conexión como en el `CREATE DATABASE`.

## Variables de entorno

Copiar `.env.example` a `.env` (en la raíz del monorepo y también en `apps/backend/`) y
ajustar `DATABASE_URL`:

```
DATABASE_URL=mysql://cualauto:cualauto@localhost:3306/cualautocompro?charset=utf8mb4
```

Para los tests, copiar `apps/backend/.env.test.example` a `apps/backend/.env.test`:

```
DATABASE_URL=mysql://cualauto:cualauto@localhost:3306/cualautocompro_test?charset=utf8mb4
```

## Backend

```bash
# instalar dependencias
pnpm install

# aplicar migraciones + seed
pnpm db:reset

# arrancar backend en modo dev
pnpm dev:be
```

El backend queda escuchando en `http://localhost:3000`. Health check: `GET /health`.

## Frontend

```bash
pnpm dev:fe
```

Disponible en `http://localhost:4200`.

## Tests

```bash
# backend + frontend
pnpm test

# solo backend
pnpm test:be

# solo frontend
pnpm test:fe
```

## Migraciones

```bash
# desarrollo: crea/aplica migración y regenera cliente
pnpm db:migrate

# producción: solo aplica migraciones pendientes
cd apps/backend && pnpm exec prisma migrate deploy

# poblar con datos de ejemplo
pnpm db:seed
```

## Reset completo de la base

Si necesitas empezar desde cero:

```bash
mariadb -ucualauto -pcualauto -e "DROP DATABASE cualautocompro;"
mariadb -ucualauto -pcualauto -e "DROP DATABASE cualautocompro_test;"
mariadb -ucualauto -pcualauto -e "CREATE DATABASE cualautocompro      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mariadb -ucualauto -pcualauto -e "CREATE DATABASE cualautocompro_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
pnpm db:migrate
pnpm db:seed
```