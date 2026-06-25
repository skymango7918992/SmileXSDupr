"use server";

import { revalidatePath } from "next/cache";
import { isAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { XsVenue } from "@/types/xs";

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

function revalidateXs() {
  revalidatePath("/");
}

export async function getXsVenues(): Promise<XsVenue[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("xs_venues")
    .select("*")
    .eq("active", true)
    .order("sort_order")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as XsVenue[];
}

export async function getDefaultXsVenueId(): Promise<string> {
  const venue = await getXsVenueBySlug("yuyi");
  if (!venue) {
    throw new Error("預設場地「羽懿球場」尚未建立，請執行 migration 019");
  }
  return venue.id;
}

export async function getXsVenueBySlug(slug: string): Promise<XsVenue | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("xs_venues")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as XsVenue | null;
}

export async function getXsAllVenuesAdmin(): Promise<XsVenue[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("xs_venues")
    .select("*")
    .order("sort_order")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as XsVenue[];
}

export async function createXsVenue(input: {
  name: string;
  slug?: string;
  court_count?: number;
}): Promise<XsVenue> {
  await requireAdmin();
  const name = input.name.trim();
  if (!name) throw new Error("請輸入場地名稱");

  const slug = (input.slug?.trim() || toSlug(name)).toLowerCase();
  const courtCount = input.court_count ?? 4;

  const supabase = await createClient();
  const { data: maxOrder } = await supabase
    .from("xs_venues")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  const sortOrder =
    maxOrder && maxOrder.length > 0 ? (maxOrder[0].sort_order as number) + 1 : 0;

  const { data, error } = await supabase
    .from("xs_venues")
    .insert({
      name,
      slug,
      court_count: courtCount,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidateXs();
  return data as XsVenue;
}

export async function updateXsVenue(
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
  if (input.name != null) patch.name = input.name.trim();
  if (input.slug != null) patch.slug = input.slug.trim().toLowerCase();
  if (input.court_count != null) patch.court_count = input.court_count;
  if (input.active != null) patch.active = input.active;
  if (input.sort_order != null) patch.sort_order = input.sort_order;

  const { error } = await supabase.from("xs_venues").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateXs();
}

export async function deleteXsVenue(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("match_days")
    .select("id", { count: "exact", head: true })
    .eq("venue_id", id);

  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) {
    throw new Error("此場地已有對戰紀錄，請改為停用而非刪除");
  }

  const { error } = await supabase.from("xs_venues").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateXs();
}
