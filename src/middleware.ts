import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 舊協會網址 → 合併至首頁（保留 query）
  if (pathname.startsWith("/khpa")) {
    const url = request.nextUrl.clone();
    if (pathname.startsWith("/khpa/login")) {
      url.pathname = "/login";
      url.searchParams.set("platform", "khpa");
      return NextResponse.redirect(url);
    }
    url.pathname = "/";
    if (!url.searchParams.has("portal")) {
      url.searchParams.set("portal", "khpa");
    }
    return NextResponse.redirect(url);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
