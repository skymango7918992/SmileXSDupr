import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/env";
import {
  getTrustedDeviceCookie,
  hasValidTrustedDevice,
} from "@/lib/trusted-device-server";

function isServerActionOrRsc(request: NextRequest): boolean {
  return (
    request.headers.has("Next-Action") ||
    request.headers.has("RSC") ||
    request.headers.get("Accept")?.includes("text/x-component") === true
  );
}

export async function updateSession(request: NextRequest) {
  // .env 未設定時不攔截，讓頁面顯示設定指引
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

  if (!user) {
    if (!isAuthRoute && !skipAuthRedirect) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (skipAuthRedirect) {
    return supabaseResponse;
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasTotp = (factors?.totp?.length ?? 0) > 0;
  const isSetupRoute = pathname.startsWith("/login/setup");

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
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
