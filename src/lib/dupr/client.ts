import { resolveDuprAccessToken } from "@/lib/dupr/auth";
import { getDuprConfig } from "@/lib/env";

export type DuprClubMember = {
  duprId: string;
  fullName: string;
  doublesRating: number | null;
};

type RawMember = {
  dupr_id?: string;
  duprId?: string;
  full_name?: string;
  fullName?: string;
  username?: string | null;
  doubles?: string | number | null;
  doubles_verified?: string | number | null;
  doublesVerified?: string | number | null;
  provisional_doubles_rating?: number | null;
  provisionalDoublesRating?: number | null;
};

type PageResult = {
  hits?: RawMember[];
  has_more?: boolean;
  hasMore?: boolean;
  total?: number;
};

type ApiWrapper = {
  status?: string;
  message?: string;
  result?: PageResult;
};

function pickString(...values: (string | undefined | null)[]): string {
  for (const v of values) {
    if (v?.trim()) return v.trim();
  }
  return "";
}

function parseRating(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "string" && /^NR$/i.test(value.trim())) return null;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeMember(raw: RawMember): DuprClubMember | null {
  const duprId = pickString(raw.dupr_id, raw.duprId).toUpperCase();
  const fullName = pickString(raw.full_name, raw.fullName, raw.username ?? undefined);
  if (!duprId || !fullName) return null;

  const rating =
    parseRating(raw.doubles_verified ?? raw.doublesVerified) ??
    parseRating(raw.doubles) ??
    parseRating(raw.provisional_doubles_rating ?? raw.provisionalDoublesRating);

  return { duprId, fullName, doublesRating: rating };
}

export async function fetchAllClubMembers(): Promise<DuprClubMember[]> {
  const { apiBase, clubId, apiVersion } = getDuprConfig();
  const apiToken = await resolveDuprAccessToken();
  const members: DuprClubMember[] = [];
  const limit = 25; // DUPR API 單次上限 25
  let offset = 0;

  for (let page = 0; page < 200; page++) {
    const url = `${apiBase}/club/${clubId}/members/${apiVersion}/all`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        offset,
        limit,
        query: "*",
        exclude: [],
        include_staff: false,
        include_pending_players: false,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `DUPR API 錯誤 (${res.status})：${body.slice(0, 200) || res.statusText}`,
      );
    }

    const data = (await res.json()) as ApiWrapper;
    if (data.status === "FAILURE") {
      throw new Error(data.message || "DUPR API 回傳失敗");
    }

    const pageResult = data.result;
    const hits = pageResult?.hits ?? [];

    for (const hit of hits) {
      const member = normalizeMember(hit);
      if (member) members.push(member);
    }

    const total = pageResult?.total ?? 0;
    if (hits.length === 0 || offset + limit >= total) break;
    offset += limit;
  }

  return members;
}
