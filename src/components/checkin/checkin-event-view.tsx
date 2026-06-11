"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Trash2, UserPlus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  event: CheckInEventDetail;
};

const PAYMENTS: { method: PaymentMethod; label: string; className: string }[] =
  [
    { method: "cash", label: "現金", className: "bg-emerald-600 text-white" },
    {
      method: "linepay",
      label: "Line Pay",
      className: "bg-[#00B900] text-white",
    },
    { method: "transfer", label: "匯款", className: "bg-blue-600 text-white" },
  ];

const SHOW_CATEGORIES: AttendeeCategory[] = ["play", "practice", "waitlist_play", "waitlist_practice"];

export function CheckInEventView({ event: initialEvent }: Props) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [query, setQuery] = useState("");
  const [onlyUnpaid, setOnlyUnpaid] = useState(true);
  const [walkInName, setWalkInName] = useState("");
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const { paid, unpaid, total, revenue, progress } = useMemo(() => {
    const paidList = event.attendees.filter((a) => a.payment_status === "paid");
    const unpaidList = event.attendees.filter((a) => a.payment_status === "unpaid");
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
    if (!confirm("取消此筆收款？")) return;
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
    });
  };

  const addWalkIn = () => {
    if (!walkInName.trim()) return;
    startTransition(async () => {
      await addWalkInAttendee(event.id, walkInName, "play");
      setWalkInName("");
      setWalkInOpen(false);
      window.location.reload();
    });
  };

  const handleDeleteEvent = () => {
    if (
      !confirm(`確定刪除此報到活動？\n所有收款紀錄將一併刪除，無法復原。`)
    ) {
      return;
    }
    startTransition(async () => {
      await deleteCheckInEvent(event.id);
      router.push("/checkin");
      router.refresh();
    });
  };

  return (
    <div className="pb-28">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/checkin"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={handleDeleteEvent}
          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
          刪除活動
        </button>
      </div>

      {/* 頂部進度 */}
      <div className="mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-600 p-5 text-white shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
              {SPORT_LABELS[event.sport_type]}
            </span>
            <h1 className="mt-2 text-lg font-bold leading-snug">
              {event.title || event.event_date}
            </h1>
            <p className="mt-1 text-sm text-emerald-100">
              ${event.fee_amount}/人 · 已收 ${revenue}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black tabular-nums">{progress}%</p>
            <p className="text-xs text-emerald-100">
              {paid}/{total}
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-amber-300 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 篩選 */}
      <div className="sticky top-[4.5rem] z-20 mb-4 space-y-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋姓名..."
          className="min-h-12 rounded-2xl border-0 bg-white shadow-md ring-1 ring-slate-100"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOnlyUnpaid(true)}
            className={cn(
              "min-h-11 rounded-2xl text-sm font-bold transition",
              onlyUnpaid
                ? "bg-amber-500 text-white shadow-md"
                : "bg-white text-slate-600 ring-1 ring-slate-200",
            )}
          >
            待收 {unpaid}
          </button>
          <button
            type="button"
            onClick={() => setOnlyUnpaid(false)}
            className={cn(
              "min-h-11 rounded-2xl text-sm font-bold transition",
              !onlyUnpaid
                ? "bg-emerald-700 text-white shadow-md"
                : "bg-white text-slate-600 ring-1 ring-slate-200",
            )}
          >
            全部 {total}
          </button>
        </div>
      </div>

      {/* 名單 */}
      {grouped.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-500">
          {onlyUnpaid ? "全部收完了 🎉" : "沒有符合的人員"}
        </p>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ cat, items }) => (
            <section key={cat}>
              <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
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

      {/* 底部操作 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-7xl">
          {walkInOpen ? (
            <div className="flex gap-2">
              <Input
                autoFocus
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                placeholder="姓名"
                className="min-h-14 flex-1 rounded-2xl text-base"
                onKeyDown={(e) => e.key === "Enter" && addWalkIn()}
              />
              <Button
                className="min-h-14 rounded-2xl px-6"
                disabled={pending}
                onClick={addWalkIn}
              >
                加入
              </Button>
              <Button
                variant="secondary"
                className="min-h-14 rounded-2xl"
                onClick={() => setWalkInOpen(false)}
              >
                取消
              </Button>
            </div>
          ) : (
            <Button
              className="min-h-14 w-full rounded-2xl text-base font-bold"
              onClick={() => setWalkInOpen(true)}
            >
              <UserPlus className="h-5 w-5" />
              現場加人
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
        className="flex w-full items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-left ring-1 ring-emerald-200 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check className="h-4 w-4" />
          </span>
          <div>
            <p className="font-bold text-slate-900">{attendee.name}</p>
            <p className="text-xs text-emerald-700">
              {attendee.payment_method
                ? PAYMENT_METHOD_LABELS[attendee.payment_method]
                : "已收"}{" "}
              · ${fee}
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-400">點擊取消</span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-3 shadow-md ring-1 ring-slate-100">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-lg font-bold text-slate-900">{attendee.name}</p>
        <span className="text-sm font-semibold text-slate-400">${fee}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {PAYMENTS.map(({ method, label, className }) => (
          <button
            key={method}
            type="button"
            disabled={loading}
            onClick={() => onPay(attendee.id, method)}
            className={cn(
              "flex min-h-14 items-center justify-center rounded-xl text-sm font-bold shadow-sm active:scale-95 disabled:opacity-50",
              className,
            )}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              label
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
