"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { deleteCheckInEvent } from "@/lib/actions/checkin";
import type { CheckInEventWithStats } from "@/types/checkin";
import { SPORT_LABELS } from "@/types/checkin";
import { cn } from "@/lib/utils";
import { CuteAvatar } from "@/components/brand/cute-avatar";
import { PageHero } from "@/components/brand/page-hero";
import { Button } from "@/components/ui/button";
import { CreateCheckInForm } from "./create-checkin-form";

type Props = {
  events: CheckInEventWithStats[];
};

export function CheckInHub({ events }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(events.length === 0);
  const [pending, startTransition] = useTransition();
  const { confirm, success } = useAppUi();

  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = events.filter((e) => e.event_date === today);
  const pastEvents = events.filter((e) => e.event_date !== today);

  const handleDelete = (event: CheckInEventWithStats) => {
    void (async () => {
      const ok = await confirm({
        title: `刪除「${event.title || event.event_date}」？`,
        description: "所有報到與收款紀錄將一併刪除，無法復原。",
        confirmLabel: "刪除",
        variant: "danger",
      });
      if (!ok) return;
      startTransition(async () => {
        await deleteCheckInEvent(event.id);
        success("報到活動已刪除");
        router.refresh();
      });
    })();
  };

  return (
    <div className="space-y-5">
      <PageHero variant="checkin" />

      {!showCreate && (
        <Button
          type="button"
          className="min-h-14 w-full text-base"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-5 w-5" />
          新增報到
        </Button>
      )}

      {showCreate && (
        <div className="space-y-2">
          <CreateCheckInForm
            onCreated={(id) => {
              setShowCreate(false);
              router.push(`/checkin/${id}`);
              router.refresh();
            }}
          />
          <button
            type="button"
            onClick={() => setShowCreate(false)}
            className="w-full cursor-pointer py-2 text-sm text-muted"
          >
            取消
          </button>
        </div>
      )}

      {todayEvents.length > 0 && (
        <EventSection
          title="今日"
          events={todayEvents}
          highlight
          onDelete={handleDelete}
          disabled={pending}
        />
      )}

      {pastEvents.length > 0 && (
        <EventSection
          title="過往"
          events={pastEvents}
          onDelete={handleDelete}
          disabled={pending}
        />
      )}

      {events.length === 0 && !showCreate && (
        <p className="py-8 text-center text-sm text-muted">
          貼上名單，空一行分打球／練球，即可開始收款
        </p>
      )}
    </div>
  );
}

function EventSection({
  title,
  events,
  highlight,
  onDelete,
  disabled,
}: {
  title: string;
  events: CheckInEventWithStats[];
  highlight?: boolean;
  onDelete: (event: CheckInEventWithStats) => void;
  disabled?: boolean;
}) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xs font-semibold text-muted">{title}</h2>
      {events.map((event) => {
        const pct = event.attendee_count
          ? Math.round((event.paid_count / event.attendee_count) * 100)
          : 0;

        return (
          <div
            key={event.id}
            className="flex items-stretch gap-1 rounded-[12px] border border-border bg-surface shadow-[var(--shadow-soft)]"
          >
            <Link
              href={`/checkin/${event.id}`}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 p-4"
            >
              <div className="relative shrink-0">
                <CuteAvatar
                  name={event.title || event.event_date}
                  variant="chibi"
                  size="md"
                />
                <span
                  className={cn(
                    "absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums shadow-sm",
                    highlight
                      ? "bg-primary text-white"
                      : "bg-surface-muted text-muted",
                  )}
                >
                  {pct}%
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted">
                    {SPORT_LABELS[event.sport_type]}
                  </span>
                  <span className="text-xs text-muted/70">
                    {event.event_date}
                  </span>
                </div>
                <p className="truncate font-medium text-foreground">
                  {event.title || "報到活動"}
                </p>
                <p className="text-sm text-muted">
                  待收 {event.unpaid_count} · 已收 {event.paid_count}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted/50" />
            </Link>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onDelete(event)}
              className="flex w-12 shrink-0 cursor-pointer items-center justify-center rounded-r-[12px] text-danger hover:bg-danger/10 disabled:opacity-40"
              aria-label="刪除"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        );
      })}
    </section>
  );
}
