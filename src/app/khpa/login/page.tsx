import { Suspense } from "react";
import { KhpaLoginForm } from "@/components/khpa/khpa-login-form";

export default function KhpaLoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">載入中…</div>}>
      <KhpaLoginForm />
    </Suspense>
  );
}
