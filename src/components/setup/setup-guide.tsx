import { Card, CardTitle } from "@/components/ui/card";

export function SetupGuide({ error }: { error?: string }) {
  return (
    <Card className="border-warning/30 bg-warning/8">
      <CardTitle className="mb-3">請先完成環境設定</CardTitle>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground">
        <li>
          複製{" "}
          <code className="rounded bg-surface-muted/60 px-1">.env.example</code>{" "}
          為 <code className="rounded bg-surface-muted/60 px-1">.env</code>
        </li>
        <li>
          在 <code className="rounded bg-surface-muted/60 px-1">.env</code>{" "}
          填入：
          <ul className="mt-1 list-disc pl-5 text-xs text-muted">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            <li>ADMIN_USERNAME、ADMIN_EMAIL、ADMIN_PASSWORD</li>
          </ul>
        </li>
        <li>
          至 Supabase SQL Editor 依序執行：
          <ul className="mt-1 list-disc pl-5 text-xs text-muted">
            <li>supabase/migrations/001_initial_schema.sql</li>
            <li>supabase/migrations/002_auth_rls.sql</li>
            <li>supabase/migrations/003_schedule_sessions.sql</li>
            <li>supabase/migrations/004_match_round_per_session.sql</li>
            <li>supabase/migrations/005_check_in.sql</li>
            <li>supabase/migrations/006_player_source_dupr.sql</li>
            <li>supabase/migrations/007_player_display_name.sql</li>
            <li>supabase/migrations/008_trusted_devices.sql</li>
          </ul>
        </li>
        <li>
          執行{" "}
          <code className="rounded bg-surface-muted/60 px-1">
            npm run create-admin
          </code>{" "}
          （需在 .env 設定 SUPABASE_SERVICE_ROLE_KEY）
        </li>
        <li>在 Supabase 啟用 MFA（Authentication → TOTP）</li>
        <li>
          <strong>重新啟動</strong>{" "}
          <code className="rounded bg-surface-muted/60 px-1">npm run dev</code>
        </li>
      </ol>
      {error && <p className="alert-danger mt-4">{error}</p>}
    </Card>
  );
}
