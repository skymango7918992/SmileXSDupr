import { getCloudflareContext } from "@opennextjs/cloudflare";

function trimEnv(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

async function loadMergedRuntimeEnv(): Promise<Record<string, string>> {
  const merged: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    const trimmed = trimEnv(value);
    if (trimmed) merged[key] = trimmed;
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    for (const [key, value] of Object.entries(
      env as Record<string, unknown>,
    )) {
      const trimmed = trimEnv(value);
      if (trimmed) merged[key] = trimmed;
    }
  } catch {
    // 本機 next dev 或非 Cloudflare 執行環境
  }

  return merged;
}

let mergedEnvPromise: Promise<Record<string, string>> | null = null;

/** 合併 process.env 與 Cloudflare Worker 執行期變數 */
export async function getMergedRuntimeEnv(): Promise<Record<string, string>> {
  mergedEnvPromise ??= loadMergedRuntimeEnv();
  return mergedEnvPromise;
}

/** 讀取單一執行期環境變數（Cloudflare Secrets / Variables 相容） */
export async function readRuntimeEnv(key: string): Promise<string | undefined> {
  const env = await getMergedRuntimeEnv();
  return env[key];
}
