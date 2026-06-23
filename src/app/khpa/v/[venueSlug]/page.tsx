import { redirect } from "next/navigation";
import { khpaHomePath } from "@/lib/khpa/paths";

type Props = {
  params: Promise<{ venueSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function LegacyKhpaVenueRedirect({
  params,
  searchParams,
}: Props) {
  const { venueSlug } = await params;
  const sp = await searchParams;
  redirect(
    khpaHomePath({
      venue: venueSlug,
      tab: sp.tab ?? "matches",
    }),
  );
}
