import { describe, expect, it } from "vitest";
import { currentModelYear } from "./model-year.js";

describe("currentModelYear", () => {
  it("antes del corte devuelve el año calendario", () => {
    expect(currentModelYear(new Date(2026, 7, 31))).toBe(2026); // 31-ago-2026
  });

  it("desde el corte de septiembre devuelve el año siguiente", () => {
    expect(currentModelYear(new Date(2026, 8, 1))).toBe(2027); // 1-sep-2026
    expect(currentModelYear(new Date(2026, 11, 31))).toBe(2027);
  });

  it("en enero vuelve al año calendario", () => {
    expect(currentModelYear(new Date(2027, 0, 5))).toBe(2027);
  });
});
