import { describe, it, expect, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { createApp } from "../../app.js";
import { prisma } from "../../infra/prisma.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { loginAsAdmin } from "../../../__tests__/helpers/auth.js";

const VALID_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=",
  "base64",
);

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
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Cookie", cookie)
      .attach("file", VALID_PNG, { filename: "test.png", contentType: "image/png" });
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

  it("200 happy path con AVIF válido", async () => {
    const avif = Buffer.from([
      0x00, 0x00, 0x00, 0x20,
      0x66, 0x74, 0x79, 0x70,
      0x61, 0x76, 0x69, 0x66,
      0x00, 0x00, 0x00, 0x00,
    ]);
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Cookie", cookie)
      .attach("file", avif, { filename: "test.avif", contentType: "image/avif" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      url: expect.stringMatching(/^\/uploads\/\d{4}-\d{2}\/[A-Za-z0-9_-]+\.avif$/),
      mime: "image/avif",
    });
  });

  it("rechaza contenido que no es imagen aunque se declare como AVIF", async () => {
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("no soy una imagen en absoluto"), {
        filename: "fake.avif",
        contentType: "image/avif",
      });
    expect(res.status).toBe(400);
    expect(res.body.error?.message).toMatch(/no es una imagen válida/i);
  });

  // El mime que declara el browser sale de la extensión del archivo, no de su
  // contenido; el formato real lo decide el sniffing de magic bytes.
  it("acepta PNG válido con mime image/x-png (registro de Windows)", async () => {
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Cookie", cookie)
      .attach("file", VALID_PNG, { filename: "foto.png", contentType: "image/x-png" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ mime: "image/png" });
    expect(res.body.data.url).toMatch(/\.png$/);
  });

  it("acepta PNG válido con mime application/octet-stream", async () => {
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Cookie", cookie)
      .attach("file", VALID_PNG, { filename: "foto.png", contentType: "application/octet-stream" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ mime: "image/png" });
  });

  it("guarda con la extensión del contenido cuando un .png es en realidad WebP", async () => {
    const webp = Buffer.concat([
      Buffer.from("RIFF"),
      Buffer.from([0x1a, 0x00, 0x00, 0x00]),
      Buffer.from("WEBPVP8 "),
      Buffer.alloc(18, 0),
    ]);
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Cookie", cookie)
      .attach("file", webp, { filename: "foto.png", contentType: "image/png" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ mime: "image/webp" });
    expect(res.body.data.url).toMatch(/\.webp$/);
  });

  it("acepta JPEG con bytes de padding después del marcador EOI", async () => {
    const jpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
      Buffer.alloc(20, 0),
      Buffer.from([0xff, 0xd9]),
      Buffer.from([0x84, 0x93, 0xa2, 0xb1]),
    ]);
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Cookie", cookie)
      .attach("file", jpeg, { filename: "foto.jpg", contentType: "image/jpeg" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ mime: "image/jpeg" });
    expect(res.body.data.url).toMatch(/\.jpg$/);
  });

  it("rechaza AVIF con menos de 12 bytes", async () => {
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("ftypavif"), { filename: "short.avif", contentType: "image/avif" });
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