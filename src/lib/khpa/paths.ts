import type { AppRole } from "@/lib/auth/roles";

/** 協會平台首頁（合併至 /，以 portal=khpa 區分；協會帳號可省略 portal） */
export function khpaHomePath(query?: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  params.set("portal", "khpa");
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value != null && value !== "") params.set(key, value);
    }
  }
  return `/?${params.toString()}`;
}

export function isKhpaPortal(
  portal: string | null | undefined,
  role: AppRole | null,
): boolean {
  return portal === "khpa" || role === "khpa";
}
