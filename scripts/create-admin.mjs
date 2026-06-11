/**
 * 建立星鑽 XS 管理員帳號（只需執行一次）
 *
 * 使用方式：
 *   node scripts/create-admin.mjs
 *
 * 從專案根目錄 .env 讀取（非 .env.local）：
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL=smile@xingzuan-xs.local
 *   ADMIN_PASSWORD=7918992
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL ?? "smile@xingzuan-xs.local";
const password = process.env.ADMIN_PASSWORD ?? "7918992";

if (!url || !serviceKey) {
  console.error("請在 .env 設定 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existing } = await supabase.auth.admin.listUsers();
const found = existing?.users?.find((u) => u.email === email);

if (found) {
  console.log(`管理員已存在：${email}`);
  process.exit(0);
}

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  console.error("建立失敗：", error.message);
  process.exit(1);
}

console.log("管理員建立成功！");
console.log(`  帳號（登入用）：Smile`);
console.log(`  Email（Supabase）：${email}`);
console.log(`  密碼：${password}`);
console.log(`  User ID：${data.user.id}`);
console.log("\n請至 /login 登入，首次會引導綁定 Google Authenticator。");
