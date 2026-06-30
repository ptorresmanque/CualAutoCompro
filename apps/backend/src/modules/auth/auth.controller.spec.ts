import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

describe("Auth endpoints", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("POST /auth/register crea usuario y setea cookie auth", async () => {
    const res = await request(createApp())
      .post("/api/v1/auth/register")
      .send({ email: "pat" + "@" + "test.cl", password: "secreto123", name: "Patricio" });
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("pat" + "@" + "test.cl");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^auth=/);
  });

  it("POST /auth/login con credenciales válidas retorna usuario + cookie", async () => {
    await request(createApp()).post("/api/v1/auth/register").send({ email: "pat" + "@" + "test.cl", password: "secreto123", name: "Patricio" });
    const res = await request(createApp()).post("/api/v1/auth/login").send({ email: "pat" + "@" + "test.cl", password: "secreto123" });
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("pat" + "@" + "test.cl");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^auth=/);
  });

  it("POST /auth/login con password incorrecto retorna 401 UNAUTHORIZED", async () => {
    await request(createApp()).post("/api/v1/auth/register").send({ email: "pat" + "@" + "test.cl", password: "secreto123", name: "Patricio" });
    const res = await request(createApp()).post("/api/v1/auth/login").send({ email: "pat" + "@" + "test.cl", password: "mala" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
