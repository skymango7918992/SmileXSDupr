# SmileXSDupr

匹克球 DUPR 對戰管理系統 — 每週對戰排程、即時計分、Excel 匯出。

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

## 部署

專案已可部署至 [Vercel](https://vercel.com)。請在 Vercel 專案設定中加入環境變數：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
