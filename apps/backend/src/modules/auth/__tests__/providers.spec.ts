import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../../__tests__/helpers/db.js";
import { prisma } from "../../../infra/prisma.js";

describe("GET /auth/providers", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("devuelve google/apple segun envs (en test ambos false)", async () => {
    const res = await request(createApp()).get("/api/v1/auth/providers");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ google: false, apple: false });
  });
});