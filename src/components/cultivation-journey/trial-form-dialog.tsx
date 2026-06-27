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
  const [wins, setWins] = useState("0");
  const [losses, setLosses] = useState("0");
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
    const w = Number(wins);
    const l = Number(losses);
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
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min={0}
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder="勝場"
              className="cj-input h-11 text-center font-bold"
            />
            <Input
              type="number"
              min={0}
              value={losses}
              onChange={(e) => setLosses(e.target.value)}
              placeholder="敗場"
              className="cj-input h-11 text-center font-bold"
            />
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
