import { describe, expect, it } from "vitest";
import { mergeEnumFacets } from "./enum-facets.js";

describe("mergeEnumFacets", () => {
  it("incluye los canónicos aunque no tengan filas", () => {
    const facets = mergeEnumFacets(["SEDAN", "SUV"], new Map());
    expect(facets).toEqual([
      { id: "SEDAN", name: "SEDAN", count: 0 },
      { id: "SUV", name: "SUV", count: 0 },
    ]);
  });

  it("suma los valores que solo existen en la DB (creados con 'Otro')", () => {
    const facets = mergeEnumFacets(["SEDAN"], new Map([["MINI_VAN", 3]]));
    expect(facets.map((f) => f.id)).toEqual(["MINI_VAN", "SEDAN"]);
    expect(facets.find((f) => f.id === "MINI_VAN")?.count).toBe(3);
  });

  it("no duplica un canónico que además tiene filas", () => {
    const facets = mergeEnumFacets(["SUV"], new Map([["SUV", 7]]));
    expect(facets).toEqual([{ id: "SUV", name: "SUV", count: 7 }]);
  });
});
