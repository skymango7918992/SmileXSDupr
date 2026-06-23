import { getAdminEmail, getKhpaEmail } from "@/lib/auth/config";

export type AppRole = "admin" | "khpa";

export function getRoleFromEmail(email: string | undefined | null): AppRole | null {
  if (!email) return null;
  const normalized = email.toLowerCase();
  if (normalized === getAdminEmail().toLowerCase()) return "admin";
  if (normalized === getKhpaEmail().toLowerCase()) return "khpa";
  return null;
}

export function isAdminRole(email: string | undefined | null): boolean {
  return getRoleFromEmail(email) === "admin";
}

export function canDeleteMatches(email: string | undefined | null): boolean {
  return isAdminRole(email);
}
