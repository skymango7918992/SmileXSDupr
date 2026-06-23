import { redirect } from "next/navigation";
import { khpaHomePath } from "@/lib/khpa/paths";

type Props = {
  params: Promise<{ venueSlug: string }>;
};

export default async function LegacyKhpaVenuePlayersRedirect({
  params,
}: Props) {
  const { venueSlug } = await params;
  redirect(khpaHomePath({ venue: venueSlug, tab: "players" }));
}
