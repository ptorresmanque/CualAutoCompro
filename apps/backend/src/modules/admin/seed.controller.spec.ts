import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

describe("admin seed templates", () => {
  const app = createApp();

  it("GET /api/v1/admin/seed/template/brand sin auth → 401", async () => {
    const res = await request(app).get("/api/v1/admin/seed/template/brand");
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/admin/seed/template/model sin auth → 401", async () => {
    const res = await request(app).get("/api/v1/admin/seed/template/model");
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/admin/seed/template/version sin auth → 401", async () => {
    const res = await request(app).get("/api/v1/admin/seed/template/version");
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/admin/seed/template/equipment sin auth → 401", async () => {
    const res = await request(app).get("/api/v1/admin/seed/template/equipment");
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/admin/seed/template/maintenance sin auth → 401", async () => {
    const res = await request(app).get("/api/v1/admin/seed/template/maintenance");
    expect(res.status).toBe(401);
  });
});