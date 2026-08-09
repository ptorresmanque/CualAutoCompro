import { describe, expect, it } from "vitest";
import { createModelSchema, updateModelSchema } from "./models.dto.admin.js";

const baseInput = {
  brandId: "b1",
  name: "Corolla",
  segment: "SEDAN",
};

// `segment` es un "enum abierto": el admin da de alta valores nuevos desde la
// opción "Otro" del formulario. Por eso ModelsService escribe con raw SQL —
// Prisma rechazaría un token fuera del enum generado— y por eso ENUM_REGEX es
// la ÚNICA barrera entre lo que escribe el admin y ese SQL. Antes había además
// un `extendEnum()` que validaba lo mismo, pero era un no-op en MariaDB y se
// borró. Si estos tests se caen, el borde quedó abierto.
describe("models.dto.admin enum abierto (segment)", () => {
  it("acepta un segmento nuevo que respeta el formato", () => {
    const parsed = createModelSchema.safeParse({ ...baseInput, segment: "MINI_VAN" });
    expect(parsed.success).toBe(true);
  });

  it.each([
    ["minúsculas", "sedan"],
    ["con espacio", "MINI VAN"],
    ["con guión", "MINI-VAN"],
    ["vacío", ""],
    ["intento de inyección SQL", "'; DROP TABLE `Model`; --"],
  ])("rechaza segment %s", (_caso, segment) => {
    expect(createModelSchema.safeParse({ ...baseInput, segment }).success).toBe(false);
  });

  it("rechaza un segmento más largo que el ancho de la columna", () => {
    expect(
      createModelSchema.safeParse({ ...baseInput, segment: "A".repeat(41) }).success,
    ).toBe(false);
  });

  it("update aplica el mismo regex", () => {
    expect(updateModelSchema.safeParse({ segment: "BAD VALUE" }).success).toBe(false);
    expect(updateModelSchema.safeParse({ segment: "MINI_VAN" }).success).toBe(true);
  });
});
