"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "對戰中心", exact: true },
  { href: "/checkin", label: "報到收款" },
  { href: "/leaderboard", label: "獲勝榜" },
  { href: "/players", label: "球員管理" },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/50 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-sm font-black text-slate-900 shadow-lg shadow-amber-500/30">
            XS
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              星鑽 XS 匹克球
            </h1>
            <p className="text-xs text-slate-500">
              DUPR 專業賽事管理 · 即時計分 · CSV 匯出
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-800">已登入</span>
          </div>
          <Link href="/settings">
            <Button variant="secondary" size="sm">
              <Settings className="h-4 w-4" />
              設定
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
            <LogOut className="h-4 w-4" />
            登出
          </Button>
        </div>
      </div>

      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4">
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
                "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-emerald-800 to-emerald-700 text-white shadow-md shadow-emerald-900/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
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
