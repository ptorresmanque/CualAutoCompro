import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import { createApp } from "../../app.js";
import { prisma } from "../../infra/prisma.js";

describe("maintenance GET /", () => {
  let app: express.Express;
  beforeAll(() => {
    app = createApp();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("200 sin auth con shape correcto", async () => {
    const res = await request(app).get("/api/v1/maintenance");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          versionId: expect.any(String),
          mileageTag: expect.any(Number),
          costClp: expect.any(Number),
        }),
      );
    }
  });
});
