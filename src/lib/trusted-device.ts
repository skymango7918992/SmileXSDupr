export const TRUSTED_DEVICE_COOKIE = "xs_trusted_device";

export const DEFAULT_TRUSTED_DEVICE_DAYS = 7;

export function clampTrustedDeviceDays(days: number): number {
  if (!Number.isFinite(days)) return DEFAULT_TRUSTED_DEVICE_DAYS;
  return Math.min(365, Math.max(1, Math.round(days)));
}

export async function hashDeviceToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function createDeviceToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}
