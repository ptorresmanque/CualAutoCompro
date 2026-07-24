import { describe, expect, it } from "vitest";
import { createVersionSchema, updateVersionSchema } from "./versions.dto.admin.js";

const baseInput = {
  modelId: "m1",
  name: "Sport",
  year: 2025,
  priceClp: 15000000,
  transmission: "AUTOMATIC",
  fuel: "BENCINA",
  engineDisplacementCc: 2000,
  powerHp: 150,
  torqueNm: 200,
  consumptionCityKmL: 12.5,
  consumptionHighwayKmL: 16.0,
  lengthMm: 4500,
  widthMm: 1800,
  heightMm: 1450,
  weightKg: 1300,
  trunkLiters: 450,
};

describe("versions.dto.admin recall validation", () => {
  it("create acepta hasRecall=false sin recallUrl", () => {
    const parsed = createVersionSchema.safeParse({ ...baseInput, hasRecall: false });
    expect(parsed.success).toBe(true);
  });

  it("create rechaza hasRecall=true sin recallUrl", () => {
    const parsed = createVersionSchema.safeParse({ ...baseInput, hasRecall: true });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.path.includes("recallUrl"))).toBe(true);
    }
  });

  it("create acepta hasRecall=true con recallUrl URL válida", () => {
    const parsed = createVersionSchema.safeParse({
      ...baseInput,
      hasRecall: true,
      recallUrl: "https://sernac.cl/recall/123",
    });
    expect(parsed.success).toBe(true);
  });

  it("create rechaza recallUrl que no es URL", () => {
    const parsed = createVersionSchema.safeParse({
      ...baseInput,
      hasRecall: true,
      recallUrl: "no-es-url",
    });
    expect(parsed.success).toBe(false);
  });

  it("update aplica la misma validación", () => {
    const parsed = updateVersionSchema.safeParse({ hasRecall: true });
    expect(parsed.success).toBe(false);
  });
});
