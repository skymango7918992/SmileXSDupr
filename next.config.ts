import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// 僅本機開發啟用 Cloudflare 綁定，不影響 Vercel 的 next build
if (process.env.NODE_ENV === "development") {
  const { initOpenNextCloudflareForDev } =
    require("@opennextjs/cloudflare") as typeof import("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
}
