export function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME ?? "Smile";
}

export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL ?? "smile@xingzuan-xs.local";
}

export function isValidAdminUsername(username: string): boolean {
  return username.trim().toLowerCase() === getAdminUsername().toLowerCase();
}

export function usernameToEmail(username: string): string | null {
  if (!isValidAdminUsername(username)) return null;
  return getAdminEmail();
}
