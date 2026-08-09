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

// Estos tokens son "enums abiertos": el admin puede dar de alta valores nuevos
// desde la opción "Otro", así que `fuel` y `transmission` son strings libres
// acotados por ENUM_REGEX. Ese regex es la ÚNICA barrera entre lo que escribe
// el admin y el `raw SQL` de VersionsService — antes había además un
// `extendEnum()` que validaba lo mismo, pero era un no-op en MariaDB y se
// borró. Si estos tests se caen, el borde quedó abierto.
describe("versions.dto.admin enums abiertos (fuel / transmission)", () => {
  it("acepta un token nuevo que respeta el formato", () => {
    const parsed = createVersionSchema.safeParse({
      ...baseInput,
      fuel: "HIDROGENO",
      transmission: "DOBLE_EMBRAGUE",
    });
    expect(parsed.success).toBe(true);
  });

  it.each([
    ["minúsculas", "bencina"],
    ["con espacio", "BAD VALUE"],
    ["con guión", "BAD-VALUE"],
    ["vacío", ""],
    ["intento de inyección SQL", "'; DROP TABLE `Version`; --"],
  ])("rechaza fuel %s", (_caso, fuel) => {
    expect(createVersionSchema.safeParse({ ...baseInput, fuel }).success).toBe(false);
  });

  it.each([
    ["minúsculas", "automatic"],
    ["con espacio", "BAD VALUE"],
    ["intento de inyección SQL", "'; DROP TABLE `Version`; --"],
  ])("rechaza transmission %s", (_caso, transmission) => {
    expect(createVersionSchema.safeParse({ ...baseInput, transmission }).success).toBe(false);
  });

  it("update aplica el mismo regex", () => {
    expect(updateVersionSchema.safeParse({ fuel: "BAD VALUE" }).success).toBe(false);
    expect(updateVersionSchema.safeParse({ transmission: "bad" }).success).toBe(false);
  });
});
