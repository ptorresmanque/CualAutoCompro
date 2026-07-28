import type { Express } from "express";
import bcrypt from "bcrypt";
import request from "supertest";
import { prisma } from "../../src/infra/prisma.js";
import { env } from "../../src/config/env.js";
import { resetAuthRateLimit } from "../../src/modules/auth/auth-rate-limit.js";

export const loginAsAdmin = async (app: Express): Promise<string> => {
  // El rate limit de login (10 intentos / 15 min por IP) es un Map en memoria
  // compartido por todo el archivo de tests: un spec con más de 10 casos que
  // loguean en `beforeEach` empieza a recibir 429. Lo limpiamos porque acá el
  // login es setup, no el comportamiento bajo prueba.
  resetAuthRateLimit();
  const email = env.ADMIN_EMAIL;
  const password = env.ADMIN_INITIAL_PASSWORD;
  const passwordHash = await bcrypt.hash(password, 4);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", name: "Admin" },
    create: { email, passwordHash, name: "Admin", role: "ADMIN" },
  });
  const res = await request(app).post("/api/v1/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`loginAsAdmin failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const cookie = res.headers["set-cookie"]?.[0];
  if (!cookie) throw new Error("loginAsAdmin: no cookie set");
  return cookie;
};