"use client";

import { useEffect, useState } from "react";
import {
  getDefaultLocationId,
  resolveLocationName,
  VenueLocationField,
} from "@/components/cultivation-journey/venue-location-field";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PracticeLocationOption } from "@/types/technique-practice";
import { cn } from "@/lib/utils";

type Props = {
  locations: PracticeLocationOption[];
  onSubmit: (input: {
    occurred_on: string;
    venue_name: string;
    trial_wins: number;
    trial_losses: number;
    notes?: string;
  }) => Promise<void>;
  onClose: () => void;
};

export function TrialFormDialog({ locations, onSubmit, onClose }: Props) {
  const [occurredOn, setOccurredOn] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [locationId, setLocationId] = useState(() =>
    getDefaultLocationId(locations),
  );
  const [customLocation, setCustomLocation] = useState("");
  const [wins, setWins] = useState("");
  const [losses, setLosses] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { error: toastError, success } = useAppUi();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleSubmit = async () => {
    const venue_name = resolveLocationName(
      locations,
      locationId,
      customLocation,
    );
    if (!venue_name) {
      toastError("請選擇或填寫試煉地點／賽事名稱");
      return;
    }
    const w = wins === "" ? 0 : Number(wins);
    const l = losses === "" ? 0 : Number(losses);
    if (Number.isNaN(w) || Number.isNaN(l) || w < 0 || l < 0) {
      toastError("請輸入有效勝敗場數");
      return;
    }
    if (w + l === 0) {
      toastError("請至少記錄一場勝或敗");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        occurred_on: occurredOn,
        venue_name,
        trial_wins: w,
        trial_losses: l,
        notes,
      });
      success("天榜試煉已記入修行冊");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cj-modal-root">
      <div className="cj-modal-overlay absolute inset-0" aria-hidden onClick={onClose} />
      <Card className="cj-modal glass-modal relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl">
        <div className="cj-modal-header border-b px-4 py-3">
          <CardTitle className="text-base">天榜試煉</CardTitle>
          <p className="text-xs cj-modal-muted">正式 DUPR 比賽 · 完成 +15，每勝 +5</p>
        </div>
        <div className="space-y-3 px-4 py-3">
          <Field label="試煉日期">
            <Input
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              className="cj-input h-11"
            />
          </Field>
          <VenueLocationField
            label="試煉地點／賽事"
            variant="modal"
            locations={locations}
            locationId={locationId}
            onLocationIdChange={setLocationId}
            customLocation={customLocation}
            onCustomLocationChange={setCustomLocation}
            customPlaceholder="輸入賽事或地點名稱"
          />
          <div>
            <p className="cj-field-label mb-2">試煉戰績</p>
            <p className="mb-2 text-[11px] cj-modal-muted">
              左邊填<strong className="text-emerald-700">勝場</strong>、右邊填
              <strong className="text-rose-700">敗場</strong>，可用 ± 快速調整
            </p>
            <div className="grid grid-cols-2 gap-3">
              <TrialCountField
                id="trial-wins"
                label="勝場"
                hint="贏了幾場"
                variant="win"
                value={wins}
                onChange={setWins}
              />
              <TrialCountField
                id="trial-losses"
                label="敗場"
                hint="輸了幾場"
                variant="loss"
                value={losses}
                onChange={setLosses}
              />
            </div>
          </div>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="心得（選填）"
            className="cj-input h-11"
          />
          <div className="cj-modal-footer flex gap-2 border-t pt-4">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              取消
            </Button>
            <Button onClick={() => void handleSubmit()} loading={loading} className="flex-1">
              記錄試煉
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="cj-field-label">{label}</p>
      {children}
    </div>
  );
}

function TrialCountField({
  id,
  label,
  hint,
  variant,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  variant: "win" | "loss";
  value: string;
  onChange: (value: string) => void;
}) {
  const isWin = variant === "win";
  const numeric = value === "" ? 0 : Number(value);

  const bump = (delta: number) => {
    const next = Math.max(0, numeric + delta);
    onChange(String(next));
  };

  const handleInput = (raw: string) => {
    if (raw === "") {
      onChange("");
      return;
    }
    const digits = raw.replace(/\D/g, "");
    onChange(digits === "" ? "" : String(Math.min(99, Number(digits))));
  };

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-2.5",
        isWin
          ? "border-emerald-300/80 bg-emerald-50/80"
          : "border-rose-300/80 bg-rose-50/80",
      )}
    >
      <label htmlFor={id} className="block text-center">
        <span
          className={cn(
            "text-sm font-bold",
            isWin ? "text-emerald-800" : "text-rose-800",
          )}
        >
          {isWin ? "✓ " : "✗ "}
          {label}
        </span>
        <span className="mt-0.5 block text-[10px] font-medium text-muted">
          {hint}
        </span>
      </label>
      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`${label}減 1`}
          onClick={() => bump(-1)}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-xl font-bold transition-colors",
            isWin
              ? "border-emerald-200 bg-white text-emerald-700 active:bg-emerald-100"
              : "border-rose-200 bg-white text-rose-700 active:bg-rose-100",
          )}
        >
          −
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="0"
          aria-label={label}
          className={cn(
            "cj-input h-11 min-w-0 flex-1 rounded-lg border-2 bg-white text-center text-2xl font-bold tabular-nums",
            isWin
              ? "border-emerald-200 text-emerald-900 focus:border-emerald-400"
              : "border-rose-200 text-rose-900 focus:border-rose-400",
          )}
        />
        <button
          type="button"
          aria-label={`${label}加 1`}
          onClick={() => bump(1)}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-xl font-bold transition-colors",
            isWin
              ? "border-emerald-200 bg-white text-emerald-700 active:bg-emerald-100"
              : "border-rose-200 bg-white text-rose-700 active:bg-rose-100",
          )}
        >
          +
        </button>
      </div>
    </div>
  );
}
