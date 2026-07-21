import { describe, expect, it } from "vitest";
import { safeSlug, slugify } from "./slug.js";

describe("slugify", () => {
  it("lowercases ASCII text and replaces spaces with dashes", () => {
    expect(slugify("Toyota Corolla")).toBe("toyota-corolla");
  });

  it("strips diacritics (accents)", () => {
    expect(slugify("Mañé")).toBe("mane");
    expect(slugify("Niño José")).toBe("nino-jose");
  });

  it("collapses runs of non-alphanumeric characters into a single dash", () => {
    expect(slugify("Hyundai  --  i10!!!")).toBe("hyundai-i10");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("---hello---")).toBe("hello");
  });

  it("returns empty string for purely non-alphanumeric input", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("safeSlug", () => {
  it("returns the slug when input is valid", () => {
    expect(safeSlug("BMW X5")).toBe("bmw-x5");
  });

  it("falls back to 'n-<random>' when slug would be empty", () => {
    const out = safeSlug("!!!");
    expect(out.startsWith("n-")).toBe(true);
    expect(out.length).toBeGreaterThan(2);
  });
});
