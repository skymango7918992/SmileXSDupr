import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ venueSlug: string }>;
};

export default async function KhpaVenuePlayersRedirect({ params }: Props) {
  const { venueSlug } = await params;
  redirect(`/khpa?venue=${venueSlug}&tab=players`);
}
