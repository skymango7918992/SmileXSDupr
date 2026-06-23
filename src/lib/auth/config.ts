import { getAdminEnv, getKhpaEnv } from "@/lib/env";

export type LoginPortal = "xs" | "khpa";

export function getAdminUsername(): string {
  return getAdminEnv().username;
}

export function getAdminEmail(): string {
  return getAdminEnv().email;
}

export function getKhpaUsername(): string {
  return getKhpaEnv().username;
}

export function getKhpaEmail(): string {
  return getKhpaEnv().email;
}

export function isValidAdminUsername(username: string): boolean {
  return username.trim().toLowerCase() === getAdminUsername().toLowerCase();
}

export function isValidKhpaUsername(username: string): boolean {
  return username.trim().toLowerCase() === getKhpaUsername().toLowerCase();
}

export function usernameToEmail(
  username: string,
  portal: LoginPortal = "xs",
): string | null {
  const u = username.trim().toLowerCase();
  if (portal === "khpa") {
    if (u === getKhpaUsername().toLowerCase()) return getKhpaEmail();
    if (u === getAdminUsername().toLowerCase()) return getAdminEmail();
    return null;
  }
  if (isValidAdminUsername(username)) return getAdminEmail();
  return null;
}
