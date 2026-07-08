# Setup

Guía para levantar el entorno de desarrollo local de **cualautocompro**.

## Requisitos

- Node.js 20+ (incluye npm 10+)
- npm 10+ (incluido con Node.js 20+)
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
CREATE USER IF NOT EXISTS 'cualauto'@'127.0.0.1' IDENTIFIED BY 'cualauto';
CREATE USER IF NOT EXISTS 'cualauto'@'%'          IDENTIFIED BY 'cualauto';
GRANT ALL PRIVILEGES ON *.* TO 'cualauto'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO 'cualauto'@'127.0.0.1';
GRANT ALL PRIVILEGES ON *.* TO 'cualauto'@'%';
FLUSH PRIVILEGES;
SQL
```

> **Por qué GRANT global (`*.*`):** `prisma migrate dev` necesita crear una **shadow DB**
> para detectar drift. Si el usuario solo tiene grants por-database, falla con `P3014`
> y obliga a usar el workaround `prisma migrate diff` + `prisma migrate deploy`.

> **Por qué los 3 hosts:** las conexiones TCP a `localhost:3306` pueden resolverse como
> `cualauto@'localhost'` o `cualauto@'127.0.0.1'` dependiendo del cliente y la config del
> servidor. Crear los 3 evita fallos intermitentes.

### Opción C: Instalación local (Ubuntu/Debian)

```bash
sudo apt install mariadb-server
sudo systemctl start mariadb
sudo mariadb
# dentro del cliente:
CREATE USER IF NOT EXISTS 'cualauto'@'localhost' IDENTIFIED BY 'cualauto';
CREATE USER IF NOT EXISTS 'cualauto'@'127.0.0.1' IDENTIFIED BY 'cualauto';
CREATE USER IF NOT EXISTS 'cualauto'@'%'          IDENTIFIED BY 'cualauto';
GRANT ALL PRIVILEGES ON *.* TO 'cualauto'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO 'cualauto'@'127.0.0.1';
GRANT ALL PRIVILEGES ON *.* TO 'cualauto'@'%';
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
npm install

# aplicar migraciones + seed
npm run db:reset

# arrancar backend en modo dev
npm run dev:be
```

El backend queda escuchando en `http://localhost:3000`. Health check: `GET /health`.

## Frontend

```bash
npm run dev:fe
```

Disponible en `http://localhost:4200`.

## Tests

```bash
# backend + frontend
npm test

# solo backend
npm run test:be

# solo frontend
npm run test:fe
```

## Migraciones

```bash
# desarrollo: crea/aplica migración y regenera cliente
npm run db:migrate

# producción: solo aplica migraciones pendientes
cd apps/backend && npx prisma migrate deploy

# poblar con datos de ejemplo
npm run db:seed
```

## Reset completo de la base

Si necesitas empezar desde cero:

```bash
mariadb -ucualauto -pcualauto -e "DROP DATABASE cualautocompro;"
mariadb -ucualauto -pcualauto -e "DROP DATABASE cualautocompro_test;"
mariadb -ucualauto -pcualauto -e "CREATE DATABASE cualautocompro      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mariadb -ucualauto -pcualauto -e "CREATE DATABASE cualautocompro_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npm run db:migrate
npm run db:seed
```