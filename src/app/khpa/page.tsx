import { redirect } from "next/navigation";
import { khpaHomePath } from "@/lib/khpa/paths";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

/** 舊網址 /khpa → 合併至首頁 */
export default async function LegacyKhpaRedirect({ searchParams }: Props) {
  const params = await searchParams;
  redirect(
    khpaHomePath({
      tab: params.tab,
      venue: params.venue,
    }),
  );
}
