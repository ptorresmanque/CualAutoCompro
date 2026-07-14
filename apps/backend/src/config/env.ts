import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { z } from "zod";

// Decide cual archivo .env cargar:
//   - NODE_ENV === "production" -> .env  (secrets reales en el server)
//   - NODE_ENV === "test"        -> no tocamos nada (setup.ts carga .env.test)
//   - .env.development existe    -> .env.development (preferido para local dev)
//   - sino                       -> .env (compatibilidad)
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

if (process.env.NODE_ENV === "production" && env.ADMIN_INITIAL_PASSWORD === "admin1234") {
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

export type Env = z.infer<typeof schema>;
