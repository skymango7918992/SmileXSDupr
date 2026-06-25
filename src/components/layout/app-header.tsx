"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { ClubLogo } from "@/components/brand/club-logo";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { khpaHomePath } from "@/lib/khpa/paths";
import { Button } from "@/components/ui/button";

const allNavItems = [
  { href: "/", label: "對戰中心", exact: true },
  { href: "/cultivation", label: "修行軌跡", staffHidden: true },
  { href: "/checkin", label: "報到收款", staffHidden: true },
  { href: "/leaderboard", label: "獲勝榜" },
  { href: "/players", label: "球員管理" },
] as const;

type Props = {
  role?: AppRole | null;
};

export function AppHeader({ role = null }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const isStaff = role === "staff";
  const navItems = isStaff
    ? allNavItems.filter((item) => !("staffHidden" in item && item.staffHidden))
    : allNavItems;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="glass-header sticky top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <ClubLogo size={40} className="ring-2 ring-white/80" priority />
          <div>
            <h1 className="text-base font-semibold text-foreground">
              星鑽 XS 匹克球
            </h1>
            <p className="flex items-center gap-1 text-[11px] text-muted">
              <span aria-hidden>🏓</span>
              DUPR 賽事管理 · 即時計分 · CSV 匯出
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="tag tag-primary mr-1 hidden items-center gap-1 sm:inline-flex">
            <span aria-hidden>●</span>
            已登入
          </span>
          {!isStaff && (
            <Link href={khpaHomePath()}>
              <Button variant="ghost" size="sm" aria-label="協會平台">
                <span aria-hidden>🏓</span>
                <span className="hidden sm:inline">協會</span>
              </Button>
            </Link>
          )}
          {!isStaff && (
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">設定</span>
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">登出</span>
          </Button>
        </div>
      </div>

      <nav className="glass-nav-bar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-1.5">
        {navItems.map((item) => {
          const active =
            "exact" in item && item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative cursor-pointer whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors duration-150",
                active
                  ? "glass-nav-active text-foreground"
                  : "rounded-[8px] text-secondary-foreground hover:bg-surface-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
