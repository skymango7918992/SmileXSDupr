"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Trash2, UserPlus } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { deleteCheckInEvent } from "@/lib/actions/checkin";
import {
  addWalkInAttendee,
  markAttendeePaid,
  resetAttendeePayment,
} from "@/lib/actions/checkin";
import type {
  AttendeeCategory,
  CheckInAttendee,
  CheckInEventDetail,
  PaymentMethod,
} from "@/types/checkin";
import {
  CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  SPORT_LABELS,
} from "@/types/checkin";
import { CuteAvatar } from "@/components/brand/cute-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  event: CheckInEventDetail;
};

const PAYMENTS: { method: PaymentMethod; label: string }[] = [
  { method: "cash", label: "現金" },
  { method: "linepay", label: "Line" },
  { method: "transfer", label: "匯款" },
];

const WALK_IN_CATEGORIES: AttendeeCategory[] = [
  "play",
  "practice",
  "waitlist_play",
];

const SHOW_CATEGORIES: AttendeeCategory[] = [
  "play",
  "practice",
  "waitlist_play",
  "waitlist_practice",
];

export function CheckInEventView({ event: initialEvent }: Props) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [query, setQuery] = useState("");
  const [onlyUnpaid, setOnlyUnpaid] = useState(true);
  const [walkInName, setWalkInName] = useState("");
  const [walkInCategory, setWalkInCategory] =
    useState<AttendeeCategory>("play");
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { confirm, success } = useAppUi();

  const { paid, unpaid, total, revenue, progress } = useMemo(() => {
    const paidList = event.attendees.filter((a) => a.payment_status === "paid");
    const unpaidList = event.attendees.filter(
      (a) => a.payment_status === "unpaid",
    );
    const t = event.attendees.length;
    return {
      paid: paidList.length,
      unpaid: unpaidList.length,
      total: t,
      revenue: paidList.length * event.fee_amount,
      progress: t ? Math.round((paidList.length / t) * 100) : 0,
    };
  }, [event]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return event.attendees.filter((a) => {
      if (onlyUnpaid && a.payment_status !== "unpaid") return false;
      if (q && !a.name.toLowerCase().includes(q)) return false;
      return SHOW_CATEGORIES.includes(a.category);
    });
  }, [event.attendees, onlyUnpaid, query]);

  const grouped = useMemo(() => {
    return SHOW_CATEGORIES.map((cat) => ({
      cat,
      items: list.filter((a) => a.category === cat),
    })).filter((g) => g.items.length > 0);
  }, [list]);

  const pay = (id: string, method: PaymentMethod) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        await markAttendeePaid(id, method);
        success(`已收款（${PAYMENT_METHOD_LABELS[method]}）`);
        setEvent((prev) => ({
          ...prev,
          attendees: prev.attendees.map((a) =>
            a.id === id
              ? {
                  ...a,
                  payment_status: "paid",
                  payment_method: method,
                  checked_in_at: new Date().toISOString(),
                }
              : a,
          ),
        }));
      } finally {
        setPendingId(null);
      }
    });
  };

  const undo = (id: string) => {
    void (async () => {
      const ok = await confirm({
        title: "取消此筆收款？",
        description: "將恢復為未收款狀態。",
        confirmLabel: "取消收款",
        variant: "danger",
      });
      if (!ok) return;
      startTransition(async () => {
        await resetAttendeePayment(id);
        setEvent((prev) => ({
          ...prev,
          attendees: prev.attendees.map((a) =>
            a.id === id
              ? {
                  ...a,
                  payment_status: "unpaid",
                  payment_method: null,
                  checked_in_at: null,
                }
              : a,
          ),
        }));
        success("已取消收款");
      });
    })();
  };

  const addWalkIn = () => {
    if (!walkInName.trim()) return;
    startTransition(async () => {
      const added = await addWalkInAttendee(
        event.id,
        walkInName,
        walkInCategory,
      );
      setEvent((prev) => ({
        ...prev,
        attendees: [...prev.attendees, added],
      }));
      setWalkInName("");
      setWalkInOpen(false);
      success(`已新增 ${added.name}`);
    });
  };

  const handleDeleteEvent = () => {
    void (async () => {
      const ok = await confirm({
        title: "刪除此報到活動？",
        description: "所有收款紀錄將一併刪除，無法復原。",
        confirmLabel: "刪除",
        variant: "danger",
      });
      if (!ok) return;
      startTransition(async () => {
        await deleteCheckInEvent(event.id);
        router.push("/checkin");
        router.refresh();
      });
    })();
  };

  return (
    <div className="pb-28">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/checkin"
          className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={handleDeleteEvent}
          className="inline-flex cursor-pointer items-center gap-1 rounded-[10px] px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
          刪除活動
        </button>
      </div>

      <div className="glass-card mb-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="tag tag-neutral">{SPORT_LABELS[event.sport_type]}</span>
            <h1 className="mt-2 text-lg font-semibold leading-snug text-foreground">
              {event.title || event.event_date}
            </h1>
            <p className="mt-1 text-sm text-muted">
              ${event.fee_amount}/人 · 已收 ${revenue}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold tabular-nums text-foreground">
              {progress}%
            </p>
            <p className="text-xs text-muted">
              {paid}/{total}
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-primary/70 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="sticky top-[4.5rem] z-20 mb-4 space-y-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋姓名..."
          className="min-h-12"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOnlyUnpaid(true)}
            className={cn(
              "min-h-11 cursor-pointer rounded-[10px] text-sm font-medium transition-colors",
              onlyUnpaid
                ? "bg-primary-subtle text-foreground"
                : "border border-border bg-surface text-secondary-foreground",
            )}
          >
            待收 {unpaid}
          </button>
          <button
            type="button"
            onClick={() => setOnlyUnpaid(false)}
            className={cn(
              "min-h-11 cursor-pointer rounded-[10px] text-sm font-medium transition-colors",
              !onlyUnpaid
                ? "bg-primary-soft/70 text-foreground"
                : "border border-border bg-surface text-secondary-foreground",
            )}
          >
            全部 {total}
          </button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          {onlyUnpaid ? "全部收完了" : "沒有符合的人員"}
        </p>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ cat, items }) => (
            <section key={cat}>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
                {CATEGORY_LABELS[cat]} · {items.length}
              </h2>
              <div className="space-y-2">
                {items.map((a) => (
                  <PersonCard
                    key={a.id}
                    attendee={a}
                    fee={event.fee_amount}
                    loading={pending && pendingId === a.id}
                    onPay={pay}
                    onUndo={undo}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="glass-header fixed inset-x-0 bottom-0 z-30 border-t border-divider p-4">
        <div className="mx-auto max-w-7xl">
          {walkInOpen ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {WALK_IN_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setWalkInCategory(cat)}
                    className={cn(
                      "cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      walkInCategory === cat
                        ? "border-primary/30 bg-primary-soft text-primary"
                        : "border-border bg-surface text-muted",
                    )}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="姓名"
                  className="min-h-11 flex-1 text-base"
                  onKeyDown={(e) => e.key === "Enter" && addWalkIn()}
                />
                <Button
                  className="min-h-11 px-5"
                  disabled={pending || !walkInName.trim()}
                  onClick={addWalkIn}
                >
                  加入
                </Button>
                <Button
                  variant="secondary"
                  className="min-h-11"
                  onClick={() => setWalkInOpen(false)}
                >
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="min-h-11 w-full"
              onClick={() => setWalkInOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              手動新增人員
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonCard({
  attendee,
  fee,
  loading,
  onPay,
  onUndo,
}: {
  attendee: CheckInAttendee;
  fee: number;
  loading: boolean;
  onPay: (id: string, m: PaymentMethod) => void;
  onUndo: (id: string) => void;
}) {
  const paid = attendee.payment_status === "paid";

  if (paid) {
    return (
      <button
        type="button"
        onClick={() => onUndo(attendee.id)}
        className="flex w-full cursor-pointer items-center justify-between rounded-[10px] border border-success/25 bg-success/10 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <CuteAvatar name={attendee.name} variant="chibi" size="sm" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-success text-white ring-2 ring-white">
              <Check className="h-3 w-3" />
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground">{attendee.name}</p>
            <p className="text-xs text-muted">
              {attendee.payment_method
                ? PAYMENT_METHOD_LABELS[attendee.payment_method]
                : "已收"}{" "}
              · ${fee}
            </p>
          </div>
        </div>
        <span className="text-xs text-muted/70">點擊取消</span>
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-surface px-3 py-2.5 shadow-[var(--shadow-card)]">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <CuteAvatar name={attendee.name} variant="chibi" size="sm" />
        <div className="min-w-0">
        <p className="truncate text-base font-medium text-foreground">
          {attendee.name}
        </p>
        <p className="text-xs text-muted">${fee}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted" />
        ) : (
          PAYMENTS.map(({ method, label }) => (
            <button
              key={method}
              type="button"
              disabled={loading}
              onClick={() => onPay(attendee.id, method)}
              className="cursor-pointer rounded-md border border-border bg-surface-muted/60 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary disabled:opacity-50"
            >
              {label}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
