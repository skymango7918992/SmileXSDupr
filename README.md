# SmileXSDupr

匹克球 DUPR 對戰管理系統 — 每週對戰排程、即時計分、DUPR 標準 CSV 匯出。

## 技術棧

- Next.js 16
- Supabase (PostgreSQL)
- Tailwind CSS

## 本機開發

```bash
npm install
cp .env.example .env
# 填入 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Supabase 設定

在 Supabase SQL Editor 執行 `supabase/migrations/001_initial_schema.sql`。

## 部署（Vercel）

專案可部署至 [Vercel](https://vercel.com)。在 **Settings → Environment Variables** 設定（請勾選 **Production**）：

**必填**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`

**DUPR Club 同步（球員管理，擇一）**

- `DUPR_EMAIL` + `DUPR_PASSWORD` + `DUPR_CLUB_ID`
- 或 `DUPR_API_TOKEN`

變數名稱須完全一致（`DUPR` 不是 `DUPP`）。**新增或修改後請 Deployments → Redeploy**，否則線上讀不到新變數。
