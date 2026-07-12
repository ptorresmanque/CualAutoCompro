import { describe, expect, it } from "vitest";
import type { ZodIssue } from "zod";
import { validation, AppError, conflict, notFound } from "./errors.js";

describe("validation()", () => {
  it("returns AppError with code VALIDATION and message", () => {
    const err = validation("Bad input");
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe("VALIDATION");
    expect(err.message).toBe("Bad input");
    expect(err.details).toBeUndefined();
  });

  it("attaches fields to details when provided", () => {
    const fields: ZodIssue[] = [
      { path: ["name"], message: "Required" } as unknown as ZodIssue,
      { path: ["year"], message: "Out of range" } as unknown as ZodIssue,
    ];
    const err = validation("Datos inválidos", fields);
    expect(err.code).toBe("VALIDATION");
    expect(err.message).toBe("Datos inválidos");
    expect(err.details).toEqual({ fields });
  });

  it("omits fields when array is empty", () => {
    const err = validation("Datos inválidos", []);
    expect(err.details).toBeUndefined();
  });

  it("omits fields when argument is undefined", () => {
    const err = validation("Datos inválidos", undefined);
    expect(err.details).toBeUndefined();
  });

  it("preserves nested path arrays in fields", () => {
    const fields: ZodIssue[] = [
      { path: ["address", "street"], message: "Required" } as unknown as ZodIssue,
    ];
    const err = validation("Datos inválidos", fields);
    expect(err.details?.fields).toEqual(fields);
  });

  it("preserves numeric path segments (arrays)", () => {
    const fields: ZodIssue[] = [
      { path: ["items", 0, "name"], message: "Required" } as unknown as ZodIssue,
    ];
    const err = validation("Datos inválidos", fields);
    expect(err.details?.fields).toEqual(fields);
  });
});

describe("conflict()", () => {
  it("returns AppError with code CONFLICT", () => {
    const err = conflict("Duplicate");
    expect(err.code).toBe("CONFLICT");
    expect(err.message).toBe("Duplicate");
    expect(err.details).toBeUndefined();
  });

  it("accepts details", () => {
    const err = conflict("Duplicate", { ids: [1, 2] });
    expect(err.details).toEqual({ ids: [1, 2] });
  });
});

describe("notFound()", () => {
  it("uses default message", () => {
    expect(notFound().message).toBe("Recurso no encontrado");
  });
});