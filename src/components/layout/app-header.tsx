"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "對戰中心" },
  { href: "/players", label: "球員管理" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-gray-900">
            PB
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              匹克球 DUPR 對戰管理
            </h1>
            <p className="text-xs text-gray-500">
              每週對戰排程 · 即時計分 · Excel 匯出
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-500">連線中</span>
          </div>
          <Link href="/settings">
            <Button variant="secondary" size="sm">
              <Settings className="h-4 w-4" />
              設定
            </Button>
          </Link>
        </div>
      </div>

      <nav className="mx-auto flex max-w-6xl gap-2 px-4 pb-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
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
