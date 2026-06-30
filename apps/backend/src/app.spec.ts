import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildTestApp } from "../__tests__/helpers/testApp.js";

describe("GET /health", () => {
  it("responde 200 con { data: { status: 'ok' } }", async () => {
    const res = await request(buildTestApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
  });
});
