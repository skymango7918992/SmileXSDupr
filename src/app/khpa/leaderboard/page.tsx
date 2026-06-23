import { redirect } from "next/navigation";
import { khpaHomePath } from "@/lib/khpa/paths";

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function LegacyKhpaLeaderboardRedirect({
  searchParams,
}: Props) {
  const params = await searchParams;
  redirect(khpaHomePath({ tab: params.tab ?? "leaderboard" }));
}
