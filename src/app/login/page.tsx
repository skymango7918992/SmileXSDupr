import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { getTrustedDeviceDays } from "@/lib/actions/trusted-device";

export default async function LoginPage() {
  const trustedDeviceDays = await getTrustedDeviceDays();

  return (
    <Suspense fallback={<div className="text-center text-sm text-muted">載入中…</div>}>
      <LoginForm trustedDeviceDays={trustedDeviceDays} />
    </Suspense>
  );
}
