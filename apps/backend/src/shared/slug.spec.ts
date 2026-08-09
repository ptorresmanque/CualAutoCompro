import { describe, expect, it } from "vitest";
import { slugify } from "./slug.js";

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

