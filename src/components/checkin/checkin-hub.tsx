"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { deleteCheckInEvent } from "@/lib/actions/checkin";
import type { CheckInEventWithStats } from "@/types/checkin";
import { SPORT_LABELS } from "@/types/checkin";
import { CreateCheckInForm } from "./create-checkin-form";

type Props = {
  events: CheckInEventWithStats[];
};

export function CheckInHub({ events }: Props) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(events.length === 0);
  const [pending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = events.filter((e) => e.event_date === today);
  const pastEvents = events.filter((e) => e.event_date !== today);

  const handleDelete = (event: CheckInEventWithStats) => {
    if (
      !confirm(
        `確定刪除「${event.title || event.event_date}」？\n所有報到與收款紀錄將一併刪除。`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      await deleteCheckInEvent(event.id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      {!showCreate && (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 text-base font-bold text-white shadow-lg active:scale-[0.99]"
        >
          <Plus className="h-5 w-5" />
          新增報到
        </button>
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
            className="w-full py-2 text-sm text-slate-500"
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
        <p className="py-8 text-center text-sm text-slate-500">
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
      <h2 className="px-1 text-xs font-bold text-slate-500">{title}</h2>
      {events.map((event) => {
        const pct = event.attendee_count
          ? Math.round((event.paid_count / event.attendee_count) * 100)
          : 0;

        return (
          <div
            key={event.id}
            className="flex items-stretch gap-1 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
          >
            <Link
              href={`/checkin/${event.id}`}
              className="flex min-w-0 flex-1 items-center gap-3 p-4 active:scale-[0.99]"
            >
              <div
                className={
                  highlight
                    ? "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-emerald-700 text-white"
                    : "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
                }
              >
                <span className="text-lg font-black leading-none">{pct}%</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {SPORT_LABELS[event.sport_type]}
                  </span>
                  <span className="text-xs text-slate-400">
                    {event.event_date}
                  </span>
                </div>
                <p className="truncate font-bold text-slate-900">
                  {event.title || "報到活動"}
                </p>
                <p className="text-sm text-slate-500">
                  待收 {event.unpaid_count} · 已收 {event.paid_count}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
            </Link>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onDelete(event)}
              className="flex w-12 shrink-0 items-center justify-center rounded-r-2xl text-red-500 hover:bg-red-50 disabled:opacity-40"
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
