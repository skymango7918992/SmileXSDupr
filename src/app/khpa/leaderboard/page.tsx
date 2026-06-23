import { redirect } from "next/navigation";

export default function KhpaLeaderboardRedirect() {
  redirect("/khpa?tab=leaderboard");
}
