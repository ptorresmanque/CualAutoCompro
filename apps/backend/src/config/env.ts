import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { z } from "zod";

// Decide cual archivo .env cargar:
//   - NODE_ENV === "production" -> .env  (secrets reales en el server)
//   - NODE_ENV === "test"        -> no tocamos nada (setup.ts carga .env.test)
//   - .env.development existe    -> .env.development (preferido para local dev)
//   - sino                       -> .env (compatibilidad)
//
// OJO con NODE_ENV: importar @prisma/client carga por su cuenta el .env que
// esta junto al schema, y si ese archivo es la copia local del deploy trae
// NODE_ENV=production. Eso contamina el proceso de desarrollo: todo lo que
// mira NODE_ENV al evaluarse (el flag `secure` de las cookies, entre otros)
// termina en modo produccion, y una cookie Secure sobre http:// la descarta
// Safari —Chrome la acepta en localhost, asi que el bug solo se ve en Safari—.
// Por eso el script `dev` fija NODE_ENV=development: dotenv no pisa una
// variable que ya existe, asi que ese .env deja de poder cambiarla.
// Ver __tests__/dev-node-env.spec.ts.
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env"
    : process.env.NODE_ENV === "test"
      ? null
      : existsSync(".env.development")
        ? ".env.development"
        : ".env";

if (envFile) {
  // override:true para que .env.development gane sobre un .env que pueda existir
  // (p.ej. .env con valores prod-like para probar el deploy localmente).
  loadEnv({ path: envFile, override: true });
}

const schema = z.object({
  // Se valida acá y se consume por `isProduction` en vez de leer
  // `process.env.NODE_ENV` suelto: este parse corre antes de que
  // @prisma/client cargue el `.env` del deploy, así que es el único punto del
  // proceso donde la variable es confiable. Ver __tests__/dev-node-env.spec.ts.
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PORT: z.coerce.number().int().positive().default(3000),
  WEB_ORIGIN: z.string().url().default("http://localhost:4200"),
  // Origen del BACKEND (este servidor). Usado por passport como
  // callbackURL hacia Google/Apple. Defaults al puerto actual.
  BACKEND_ORIGIN: z.string().url().optional(),
  ADMIN_EMAIL: z.string().email().default("admin@cualautocompro.cl"),
  ADMIN_INITIAL_PASSWORD: z.string().min(8).default("admin1234"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),
});

// Default BACKEND_ORIGIN a la URL del backend actual (útil si se corre en otro puerto).
const rawEnv = schema.parse(process.env);
export const env: z.infer<typeof schema> & { BACKEND_ORIGIN: string } = {
  ...rawEnv,
  BACKEND_ORIGIN: rawEnv.BACKEND_ORIGIN ?? `http://localhost:${rawEnv.PORT}`,
};

export const isProduction = env.NODE_ENV === "production";

if (isProduction && env.ADMIN_INITIAL_PASSWORD === "admin1234") {
  throw new Error("ADMIN_INITIAL_PASSWORD must be overridden in production");
}

const googleCount = [env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET].filter(
  Boolean,
).length;
if (googleCount > 0 && googleCount < 2) {
  throw new Error(
    "OAuth Google mal configurado: debe setear GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET juntos o ninguno.",
  );
}

const appleCount = [
  env.APPLE_CLIENT_ID,
  env.APPLE_KEY_ID,
  env.APPLE_TEAM_ID,
  env.APPLE_PRIVATE_KEY,
].filter(Boolean).length;
if (appleCount > 0 && appleCount < 4) {
  throw new Error(
    "OAuth Apple mal configurado: requiere APPLE_CLIENT_ID, APPLE_KEY_ID, APPLE_TEAM_ID y APPLE_PRIVATE_KEY.",
  );
}
