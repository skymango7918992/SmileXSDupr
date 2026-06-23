import { isAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserEmail(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}

export async function requireXsAdmin(): Promise<string> {
  const email = await getCurrentUserEmail();
  if (!isAdminRole(email)) {
    throw new Error("僅管理員可執行此操作");
  }
  return email!;
}
