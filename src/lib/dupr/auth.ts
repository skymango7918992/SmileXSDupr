import { readRuntimeEnv } from "@/lib/runtime-env";
import { ENV_SETUP_HINT } from "@/lib/env";

type AuthResult = {
  accessToken?: string;
  access_token?: string;
  twoFactorRequired?: boolean;
  two_factor_required?: boolean;
};

type AuthWrapper = {
  status?: string;
  message?: string;
  result?: AuthResult;
};

/** 用 DUPR 帳號密碼換取 access token（Club 管理員帳號） */
export async function loginDuprWithCredentials(
  email: string,
  password: string,
): Promise<string> {
  const apiBase =
    (await readRuntimeEnv("DUPR_API_BASE")) || "https://api.dupr.gg";
  const version = (await readRuntimeEnv("DUPR_AUTH_VERSION")) || "v2.0";
  const res = await fetch(`${apiBase}/auth/${version}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  const text = await res.text();
  let data: AuthWrapper = {};
  try {
    data = JSON.parse(text) as AuthWrapper;
  } catch {
    throw new Error(`DUPR 登入失敗 (${res.status})：無法解析回應`);
  }

  if (!res.ok) {
    throw new Error(
      data.message || `DUPR 登入失敗 (${res.status})：${text.slice(0, 150)}`,
    );
  }

  if (data.status === "FAILURE") {
    throw new Error(data.message || "DUPR 登入失敗");
  }

  const result = data.result;
  const twoFactor =
    result?.twoFactorRequired ?? result?.two_factor_required ?? false;
  if (twoFactor) {
    throw new Error(
      "此 DUPR 帳號有雙因素驗證，請改用瀏覽器複製 Token 方式（見球員管理說明）",
    );
  }

  const token = result?.accessToken ?? result?.access_token;
  if (!token) {
    throw new Error("DUPR 登入成功但未取得 access token");
  }

  return token;
}

/** 解析 Bearer Token：優先 DUPR_API_TOKEN，否則用 DUPR_EMAIL + DUPR_PASSWORD 登入 */
export async function resolveDuprAccessToken(): Promise<string> {
  const direct = await readRuntimeEnv("DUPR_API_TOKEN");
  if (direct) return direct;

  const email = await readRuntimeEnv("DUPR_EMAIL");
  const password = await readRuntimeEnv("DUPR_PASSWORD");

  if (!email || !password) {
    throw new Error(
      `缺少 DUPR 連線設定。${ENV_SETUP_HINT}（DUPR_EMAIL + DUPR_PASSWORD，或 DUPR_API_TOKEN）`,
    );
  }

  return loginDuprWithCredentials(email, password);
}
