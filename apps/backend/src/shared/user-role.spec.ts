import { describe, expect, it } from "vitest";
import { isUserRole, USER_ROLES, type UserRole } from "./user-role.js";

describe("isUserRole", () => {
  it("acepta 'USER'", () => {
    expect(isUserRole("USER")).toBe(true);
  });

  it("acepta 'ADMIN'", () => {
    expect(isUserRole("ADMIN")).toBe(true);
  });

  it("rechaza 'user' (case-sensitive)", () => {
    expect(isUserRole("user")).toBe(false);
  });

  it("rechaza 'admin' (case-sensitive)", () => {
    expect(isUserRole("admin")).toBe(false);
  });

  it("rechaza string vacío", () => {
    expect(isUserRole("")).toBe(false);
  });

  it("rechaza string arbitrario", () => {
    expect(isUserRole("GUEST")).toBe(false);
  });

  it("rechaza string con SQL injection attempt", () => {
    expect(isUserRole("ADMIN' OR '1'='1")).toBe(false);
  });
});

describe("USER_ROLES", () => {
  it("contiene USER y ADMIN", () => {
    expect(USER_ROLES).toEqual(["USER", "ADMIN"]);
  });

  it("es readonly a nivel tipo (asignación literal)", () => {
    const sample: UserRole = "USER";
    expect(sample).toBe("USER");
  });
});