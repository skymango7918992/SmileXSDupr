# SmileXSDupr

匹克球 DUPR 對戰管理系統 — 每週對戰排程、即時計分、DUPR 標準 CSV 匯出。

## 技術棧

- Next.js 16
- Supabase (PostgreSQL)
- Tailwind CSS
- Cloudflare Pages / Workers（OpenNext）

## 本機開發

```bash
npm install
cp .env.example .env
# 填入環境變數
npm run dev
```

## Supabase 設定

在 Supabase SQL Editor 依序執行 `supabase/migrations/` 內的 SQL 檔案。

## 部署（Cloudflare Pages）

建議 Build 設定：

| 欄位 | 值 |
|------|-----|
| Build command | `npx @opennextjs/cloudflare build` |
| Deploy command | `npx @opennextjs/cloudflare deploy -- --keep-vars` |

### 環境變數（兩處都要設）

**1. Build variables and secrets**（建置時內嵌，給 `NEXT_PUBLIC_*` 與登入帳號對照）

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`

**2. Variables and Secrets**（執行期，給 DUPR 同步等 Server Action）

- `DUPR_EMAIL` + `DUPR_PASSWORD` + `DUPR_CLUB_ID`
- 或 `DUPR_API_TOKEN`

DUPR 密碼請用 **Secrets** 類型，變數名稱須完全一致（`DUPR` 不是 `DUPP`）。修改後請重新部署。

本機預覽 Cloudflare 執行環境：`npm run preview`
