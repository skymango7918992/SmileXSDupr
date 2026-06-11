import { Card, CardTitle } from "@/components/ui/card";

export function SetupGuide({ error }: { error?: string }) {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardTitle className="mb-3 text-amber-900">請先完成 Supabase 設定</CardTitle>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-amber-900">
        <li>
          至{" "}
          <a
            href="https://supabase.com"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            supabase.com
          </a>{" "}
          建立專案
        </li>
        <li>
          在 SQL Editor 執行{" "}
          <code className="rounded bg-white px-1">
            supabase/migrations/001_initial_schema.sql
          </code>
        </li>
        <li>
          複製{" "}
          <code className="rounded bg-white px-1">.env.example</code>{" "}
          為 <code className="rounded bg-white px-1">.env</code>{" "}
          並填入 URL 與 anon key
        </li>
        <li>
          執行{" "}
          <code className="rounded bg-white px-1">npm run create-admin</code>{" "}
          建立管理員帳號
        </li>
        <li>
          在 Supabase 後台啟用 MFA（Authentication → Multi-Factor → TOTP）
        </li>
        <li>重新啟動開發伺服器，至 /login 登入</li>
      </ol>
      {error && (
        <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </Card>
  );
}
