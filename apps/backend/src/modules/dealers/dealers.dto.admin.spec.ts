import { describe, expect, it } from "vitest";
import { createDealerSchema, updateDealerSchema } from "./dealers.dto.admin.js";

describe("dealers.dto.admin logoUrl validation", () => {
  it("create acepta logoUrl con URL absoluta", () => {
    const parsed = createDealerSchema.safeParse({
      name: "Derco",
      url: "https://derco.cl",
      logoUrl: "https://cdn.derco.cl/logo.png",
    });
    expect(parsed.success).toBe(true);
  });

  it("create acepta logoUrl con path relativo /uploads/...", () => {
    const parsed = createDealerSchema.safeParse({
      name: "Derco",
      url: "https://derco.cl",
      logoUrl: "/uploads/2026-07/abc123.png",
    });
    expect(parsed.success).toBe(true);
  });

  it("create acepta logoUrl null", () => {
    const parsed = createDealerSchema.safeParse({
      name: "Derco",
      url: "https://derco.cl",
      logoUrl: null,
    });
    expect(parsed.success).toBe(true);
  });

  it("create acepta logoUrl undefined (omitido)", () => {
    const parsed = createDealerSchema.safeParse({
      name: "Derco",
      url: "https://derco.cl",
    });
    expect(parsed.success).toBe(true);
  });

  it("create rechaza logoUrl que no es URL ni path /uploads/", () => {
    const parsed = createDealerSchema.safeParse({
      name: "Derco",
      url: "https://derco.cl",
      logoUrl: "not-a-valid-url",
    });
    expect(parsed.success).toBe(false);
  });

  it("update parcial también acepta paths relativos", () => {
    const parsed = updateDealerSchema.safeParse({
      logoUrl: "/uploads/2026-07/abc.png",
    });
    expect(parsed.success).toBe(true);
  });
});
