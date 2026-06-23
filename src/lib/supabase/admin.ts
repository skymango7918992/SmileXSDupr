import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseEnv } from "@/lib/env";

/** 僅伺服器端管理操作（更新 KHPA 密碼等） */
export function createAdminClient() {
  const serviceKey = getServiceRoleKey();
  if (!serviceKey) {
    throw new Error(
      "缺少 SUPABASE_SERVICE_ROLE_KEY，無法執行管理操作",
    );
  }
  const { supabaseUrl } = getSupabaseEnv();
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
