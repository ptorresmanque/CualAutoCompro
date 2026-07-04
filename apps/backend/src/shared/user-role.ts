export type UserRole = "USER" | "ADMIN";

export const USER_ROLES: readonly UserRole[] = ["USER", "ADMIN"] as const;

export function isUserRole(value: string): value is UserRole {
  return value === "USER" || value === "ADMIN";
}

export function narrowUserRole(value: string, fallback: UserRole = "USER"): UserRole {
  return isUserRole(value) ? value : fallback;
}