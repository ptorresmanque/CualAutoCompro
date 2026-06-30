import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env.test"), override: false });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required for backend tests. Copy apps/backend/.env.test.example to apps/backend/.env.test and set it. See docs/setup.md (TODO) for details.",
  );
}

process.env.JWT_SECRET ||= "test-secret-32-bytes-min-aaaaaaaaaa";
process.env.WEB_ORIGIN ||= "http://localhost:4200";
process.env.JWT_EXPIRES_IN ||= "7d";
process.env.PORT ||= "3001";