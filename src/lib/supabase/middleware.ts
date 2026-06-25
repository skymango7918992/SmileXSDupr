import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getRoleFromEmail, isStaffBlockedRoute } from "@/lib/auth/roles";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/env";
import {
  getTrustedDeviceCookie,
  hasValidTrustedDevice,
} from "@/lib/trusted-device-server";

const XS_ONLY_PREFIXES = [
  "/cultivation",
  "/play-map",
  "/checkin",
  "/leaderboard",
  "/players",
  "/settings",
];

function isXsOnlyRoute(pathname: string): boolean {
  return XS_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isServerActionOrRsc(request: NextRequest): boolean {
  return (
    request.headers.has("Next-Action") ||
    request.headers.has("RSC") ||
    request.headers.get("Accept")?.includes("text/x-component") === true
  );
}

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  const skipAuthRedirect = isServerActionOrRsc(request);
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login");
  const isSetupRoute = pathname.startsWith("/login/setup");

  if (!user) {
    if (!isAuthRoute && !skipAuthRedirect) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const role = getRoleFromEmail(user.email);

  if (skipAuthRedirect) {
    return supabaseResponse;
  }

  // 協會帳號：免 MFA，僅使用首頁協會平台
  if (role === "khpa") {
    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.delete("step");
      url.searchParams.delete("platform");
      url.searchParams.delete("mode");
      return NextResponse.redirect(url);
    }
    if (isXsOnlyRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // 星鑽 XS 一般使用者：免 MFA，隱藏打球軌跡／報到收款／設定
  if (role === "staff") {
    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.delete("step");
      url.searchParams.delete("platform");
      url.searchParams.delete("mode");
      return NextResponse.redirect(url);
    }
    if (isStaffBlockedRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // 星鑽 XS 管理員：維持 MFA
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasTotp = (factors?.totp?.length ?? 0) > 0;

  if (!hasTotp) {
    if (!isSetupRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login/setup";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const { data: aal } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  const needsMfa =
    aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2";

  if (needsMfa && user) {
    const deviceToken = getTrustedDeviceCookie(request.cookies.getAll());
    const trusted = await hasValidTrustedDevice(
      supabase,
      user.id,
      deviceToken,
    );
    if (trusted) {
      if (isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        url.searchParams.delete("step");
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }
  }

  if (needsMfa) {
    if (!isAuthRoute || isSetupRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("step", "verify");
      url.searchParams.set("platform", "xs");
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("step");
    url.searchParams.delete("platform");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
