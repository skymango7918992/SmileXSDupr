"use client";

import Link from "next/link";
import { LogOut, MapPin } from "lucide-react";
import { KhpaLogo } from "@/components/khpa/khpa-logo";
import { createClient } from "@/lib/supabase/client";
import type { KhpaVenue } from "@/types/khpa";
import { Button } from "@/components/ui/button";

type Props = {
  venues: KhpaVenue[];
  isAdmin?: boolean;
};

export function KhpaHeader({ venues, isAdmin }: Props) {
  const primaryVenue = venues[0];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header className="glass-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <KhpaLogo size={40} priority />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              高雄市匹克球協會
            </p>
            {primaryVenue && venues.length === 1 && (
              <p className="flex items-center gap-1 truncate text-xs text-muted">
                <MapPin className="h-3 w-3 shrink-0 text-primary" />
                {primaryVenue.name}
              </p>
            )}
            {venues.length > 1 && (
              <p className="truncate text-xs text-muted">
                {venues.length} 個活動地點
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isAdmin && (
            <Link
              href="/"
              className="hidden text-[11px] text-muted hover:text-foreground sm:inline"
            >
              星鑽 XS
            </Link>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleLogout()}
            aria-label="登出"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
