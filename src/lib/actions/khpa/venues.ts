"use server";

import { revalidatePath } from "next/cache";
import { isAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { KhpaVenue } from "@/types/khpa";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminRole(user?.email)) {
    throw new Error("僅系統管理員可操作");
  }
}

function toSlug(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);
  return base.length >= 2 ? base : `venue-${Date.now().toString(36)}`;
}

export async function getKhpaVenues(): Promise<KhpaVenue[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("khpa_venues")
    .select("*")
    .eq("active", true)
    .order("sort_order")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as KhpaVenue[];
}

export async function getKhpaVenueBySlug(slug: string): Promise<KhpaVenue | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("khpa_venues")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as KhpaVenue | null;
}

/** 管理員：含停用場地 */
export async function getKhpaAllVenuesAdmin(): Promise<KhpaVenue[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("khpa_venues")
    .select("*")
    .order("sort_order")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as KhpaVenue[];
}

export async function createKhpaVenue(input: {
  name: string;
  slug?: string;
  court_count?: number;
}): Promise<KhpaVenue> {
  await requireAdmin();
  const name = input.name.trim();
  if (!name) throw new Error("請輸入場地名稱");

  const slug = (input.slug?.trim() || toSlug(name)).toLowerCase();
  const courtCount = input.court_count ?? 3;

  const supabase = await createClient();
  const { data: maxOrder } = await supabase
    .from("khpa_venues")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = ((maxOrder?.sort_order as number | undefined) ?? -1) + 1;

  const { data, error } = await supabase
    .from("khpa_venues")
    .insert({
      name,
      slug,
      court_count: courtCount,
      sort_order: sortOrder,
      active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("此代碼（slug）已存在，請換一個");
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/settings");
  return data as KhpaVenue;
}

export async function updateKhpaVenue(
  id: string,
  input: {
    name?: string;
    slug?: string;
    court_count?: number;
    active?: boolean;
    sort_order?: number;
  },
): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (input.name != null) {
    const name = input.name.trim();
    if (!name) throw new Error("請輸入場地名稱");
    patch.name = name;
  }
  if (input.slug != null) {
    const slug = input.slug.trim().toLowerCase();
    if (slug.length < 2) throw new Error("代碼至少 2 個字元");
    patch.slug = slug;
  }
  if (input.court_count != null) patch.court_count = input.court_count;
  if (input.active != null) patch.active = input.active;
  if (input.sort_order != null) patch.sort_order = input.sort_order;

  const { error } = await supabase.from("khpa_venues").update(patch).eq("id", id);
  if (error) {
    if (error.code === "23505") throw new Error("此代碼（slug）已存在，請換一個");
    throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function deleteKhpaVenue(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("khpa_venues")
    .select("id", { count: "exact", head: true });

  if (countError) throw new Error(countError.message);
  if ((count ?? 0) <= 1) {
    throw new Error("至少需保留一個活動場地");
  }

  const { error } = await supabase.from("khpa_venues").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/settings");
}
