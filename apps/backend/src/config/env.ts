import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PORT: z.coerce.number().int().positive().default(3000),
  WEB_ORIGIN: z.string().url().default("http://localhost:4200"),
  ADMIN_EMAIL: z.string().email().default("admin@cualautocompro.cl"),
  ADMIN_INITIAL_PASSWORD: z.string().min(8).default("admin1234"),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
