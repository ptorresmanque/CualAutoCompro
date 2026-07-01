import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

describe("brands admin", () => {
  const app = createApp();

  it("GET /api/v1/admin/brands sin auth → 401", async () => {
    const res = await request(app).get("/api/v1/admin/brands");
    expect(res.status).toBe(401);
  });

  it("POST /api/v1/admin/brands sin auth → 401", async () => {
    const res = await request(app).post("/api/v1/admin/brands").send({ name: "X" });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/v1/admin/brands/:id sin auth → 401", async () => {
    const res = await request(app).delete("/api/v1/admin/brands/cuid-fake");
    expect(res.status).toBe(401);
  });
});
