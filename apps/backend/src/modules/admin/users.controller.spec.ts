import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

describe("admin users endpoints", () => {
  const app = createApp();

  it("GET /api/v1/admin/users sin auth → 401", async () => {
    const res = await request(app).get("/api/v1/admin/users");
    expect(res.status).toBe(401);
  });

  it("POST /api/v1/admin/users/:id/promote sin auth → 401", async () => {
    const res = await request(app).post("/api/v1/admin/users/some-id/promote");
    expect(res.status).toBe(401);
  });

  it("POST /api/v1/admin/users/:id/demote sin auth → 401", async () => {
    const res = await request(app).post("/api/v1/admin/users/some-id/demote");
    expect(res.status).toBe(401);
  });
});