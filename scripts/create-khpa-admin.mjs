/**
 * 建立 KHPA 協會共用帳號（只需執行一次，或於設定頁更新密碼）
 *
 * 使用方式：
 *   node scripts/create-khpa-admin.mjs
 *
 * 從專案根目錄 .env 讀取：
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   KHPA_USERNAME=KHPA
 *   KHPA_EMAIL=khpa@khpa.local
 *   KHPA_PASSWORD=your-khpa-password
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
const username = process.env.KHPA_USERNAME ?? "KHPA";
const email = process.env.KHPA_EMAIL ?? "khpa@khpa.local";
const password = process.env.KHPA_PASSWORD;

if (!url || !serviceKey) {
  console.error("請在 .env 設定 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!password) {
  console.error("請在 .env 設定 KHPA_PASSWORD");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existing } = await supabase.auth.admin.listUsers();
const found = existing?.users?.find((u) => u.email === email);

if (found) {
  const { error } = await supabase.auth.admin.updateUserById(found.id, {
    password,
  });
  if (error) {
    console.error("更新密碼失敗：", error.message);
    process.exit(1);
  }
  console.log(`協會帳號已存在，密碼已更新：${email}`);
  process.exit(0);
}

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { role: "khpa", portal: "khpa" },
});

if (error) {
  console.error("建立失敗：", error.message);
  process.exit(1);
}

console.log("協會帳號建立成功！");
console.log(`  帳號（登入用）：${username}`);
console.log(`  Email（Supabase）：${email}`);
console.log(`  密碼：${password}`);
console.log(`  User ID：${data.user.id}`);
console.log("\n請至 /khpa/login 登入（帳密 + 圖形驗證碼，無需 Google Authenticator）。");
