"use client";

import { useSearchParams } from "next/navigation";
import { SportPageDecor } from "@/components/brand/sport-page-decor";
import { AppHeader } from "@/components/layout/app-header";
import { isKhpaPortal } from "@/lib/khpa/paths";
import type { AppRole } from "@/lib/auth/roles";

type Props = {
  role: AppRole | null;
  children: React.ReactNode;
};

export function PortalShell({ role, children }: Props) {
  const searchParams = useSearchParams();
  const portal = searchParams.get("portal");
  const isKhpa = isKhpaPortal(portal, role);

  if (isKhpa) {
    return (
      <div className="page-canvas khpa-pro flex min-h-[100dvh] w-full max-w-[100vw] flex-col overflow-x-clip">
        {children}
      </div>
    );
  }

  return (
    <div className="page-canvas flex min-h-screen flex-col">
      <SportPageDecor />
      <AppHeader role={role} />
      <main className="relative z-[1] mx-auto w-full min-w-0 max-w-7xl flex-1 overflow-x-clip px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
