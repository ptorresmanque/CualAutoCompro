import { describe, it, expect, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { createApp } from "../../app.js";
import { prisma } from "../../infra/prisma.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { loginAsAdmin } from "../../../__tests__/helpers/auth.js";

describe("uploadsController", () => {
  let app: express.Express;
  let cookie: string;

  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
    app = createApp();
    cookie = await loginAsAdmin(app);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("401 sin auth", async () => {
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .attach("file", Buffer.from("hello"), { filename: "x.png", contentType: "image/png" });
    expect(res.status).toBe(401);
  });

  it("200 happy path con PNG válido", async () => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=",
      "base64",
    );
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Cookie", cookie)
      .attach("file", png, { filename: "test.png", contentType: "image/png" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      url: expect.stringMatching(/^\/uploads\/\d{4}-\d{2}\/[A-Za-z0-9_-]+\.png$/),
      mime: "image/png",
    });
  });

  it("rechaza mime no-imagen", async () => {
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("hello"), { filename: "x.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(400);
  });

  it("rechaza archivo >5MB", async () => {
    const big = Buffer.alloc(6 * 1024 * 1024, 0);
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Cookie", cookie)
      .attach("file", big, { filename: "big.png", contentType: "image/png" });
    expect(res.status).toBe(413);
  });
});