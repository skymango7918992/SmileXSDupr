import Link from "next/link";
import { CheckInEventView } from "@/components/checkin/checkin-event-view";
import { SetupGuide } from "@/components/setup/setup-guide";
import { getCheckInEvent } from "@/lib/actions/checkin";
import { hasSupabaseEnv } from "@/lib/env";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CheckInEventPage({ params }: Props) {
  if (!hasSupabaseEnv()) {
    return <SetupGuide />;
  }

  const { id } = await params;

  try {
    const event = await getCheckInEvent(id);
    if (!event) {
      return (
        <div className="py-16 text-center">
          <p className="text-slate-600">找不到此報到活動</p>
          <Link href="/checkin" className="mt-4 inline-block">
            <Button variant="secondary">返回列表</Button>
          </Link>
        </div>
      );
    }

    return <CheckInEventView event={event} />;
  } catch (error) {
    return (
      <SetupGuide
        error={error instanceof Error ? error.message : "無法載入報到活動"}
      />
    );
  }
}
