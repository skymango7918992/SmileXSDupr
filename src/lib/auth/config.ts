import { getAdminEnv } from "@/lib/env";

export function getAdminUsername(): string {
  return getAdminEnv().username;
}

export function getAdminEmail(): string {
  return getAdminEnv().email;
}

export function isValidAdminUsername(username: string): boolean {
  return username.trim().toLowerCase() === getAdminUsername().toLowerCase();
}

export function usernameToEmail(username: string): string | null {
  if (!isValidAdminUsername(username)) return null;
  return getAdminEmail();
}
