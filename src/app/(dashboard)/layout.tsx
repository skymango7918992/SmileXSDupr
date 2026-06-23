import { Suspense } from "react";
import { PortalShell } from "@/components/layout/portal-shell";
import { getRoleFromEmail } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = getRoleFromEmail(user?.email) ?? null;

  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">載入中…</div>}>
      <PortalShell role={role}>{children}</PortalShell>
    </Suspense>
  );
}
