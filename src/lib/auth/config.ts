import { getAdminEnv, getKhpaEnv, getStaffEnv } from "@/lib/env";

export type LoginPortal = "xs" | "khpa";
export type XsLoginMode = "admin" | "staff";

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

export function getStaffUsername(): string {
  return getStaffEnv().username;
}

export function getStaffEmail(): string {
  return getStaffEnv().email;
}

export function isValidAdminUsername(username: string): boolean {
  return username.trim().toLowerCase() === getAdminUsername().toLowerCase();
}

export function isValidKhpaUsername(username: string): boolean {
  return username.trim().toLowerCase() === getKhpaUsername().toLowerCase();
}

export function isValidStaffUsername(username: string): boolean {
  return username.trim().toLowerCase() === getStaffUsername().toLowerCase();
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
  if (isValidStaffUsername(username)) return getStaffEmail();
  return null;
}
