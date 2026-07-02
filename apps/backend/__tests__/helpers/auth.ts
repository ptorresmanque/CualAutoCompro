import type { Express } from "express";
import bcrypt from "bcrypt";
import request from "supertest";
import { prisma } from "../../src/infra/prisma.js";
import { env } from "../../src/config/env.js";

export const loginAsAdmin = async (app: Express): Promise<string> => {
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