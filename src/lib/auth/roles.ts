import { getAdminEmail, getKhpaEmail, getStaffEmail } from "@/lib/auth/config";

export type AppRole = "admin" | "khpa" | "staff";

export function getRoleFromEmail(email: string | undefined | null): AppRole | null {
  if (!email) return null;
  const normalized = email.toLowerCase();
  if (normalized === getAdminEmail().toLowerCase()) return "admin";
  if (normalized === getKhpaEmail().toLowerCase()) return "khpa";
  if (normalized === getStaffEmail().toLowerCase()) return "staff";
  return null;
}

export function isAdminRole(email: string | undefined | null): boolean {
  return getRoleFromEmail(email) === "admin";
}

export function isStaffRole(email: string | undefined | null): boolean {
  return getRoleFromEmail(email) === "staff";
}

export function canDeleteMatches(email: string | undefined | null): boolean {
  return isAdminRole(email);
}

export function canManagePlayers(email: string | undefined | null): boolean {
  return isAdminRole(email);
}

/** 星鑽 XS 一般使用者不可進入的路由前綴 */
export const STAFF_BLOCKED_PREFIXES = [
  "/play-map",
  "/checkin",
  "/settings",
] as const;

export function isStaffBlockedRoute(pathname: string): boolean {
  return STAFF_BLOCKED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
