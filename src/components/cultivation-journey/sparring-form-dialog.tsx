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
    team1_score: number;
    team2_score: number;
    my_team: 1 | 2;
    notes?: string;
  }) => Promise<void>;
  onClose: () => void;
};

export function SparringFormDialog({ locations, onSubmit, onClose }: Props) {
  const [occurredOn, setOccurredOn] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [locationId, setLocationId] = useState(() =>
    getDefaultLocationId(locations),
  );
  const [customLocation, setCustomLocation] = useState("");
  const [myTeam, setMyTeam] = useState<1 | 2>(1);
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");
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
      toastError("請選擇或填寫切磋地點");
      return;
    }
    const s1 = Number(team1Score);
    const s2 = Number(team2Score);
    if (Number.isNaN(s1) || Number.isNaN(s2) || s1 < 0 || s2 < 0) {
      toastError("請輸入有效比分");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        occurred_on: occurredOn,
        venue_name,
        team1_score: s1,
        team2_score: s2,
        my_team: myTeam,
        notes,
      });
      success("同門切磋已記入修行冊");
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
          <CardTitle className="text-base">同門切磋</CardTitle>
          <p className="text-xs cj-modal-muted">
            友誼賽不上傳 DUPR · 勝 +10、敗 +11 修為（DUPR 匯入勝場 +55 為關鍵分）
          </p>
        </div>
        <div className="space-y-3 px-4 py-3">
          <Field label="切磋日期">
            <Input
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              className="cj-input h-11"
            />
          </Field>
          <VenueLocationField
            label="切磋地點"
            variant="modal"
            locations={locations}
            locationId={locationId}
            onLocationIdChange={setLocationId}
            customLocation={customLocation}
            onCustomLocationChange={setCustomLocation}
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMyTeam(1)}
              className={cn(
                "rounded-xl border py-2 text-sm font-semibold",
                myTeam === 1 ? "border-primary bg-primary/10" : "border-border",
              )}
            >
              我在隊伍 1
            </button>
            <button
              type="button"
              onClick={() => setMyTeam(2)}
              className={cn(
                "rounded-xl border py-2 text-sm font-semibold",
                myTeam === 2 ? "border-amber-500 bg-amber-500/10" : "border-border",
              )}
            >
              我在隊伍 2
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min={0}
              value={team1Score}
              onChange={(e) => setTeam1Score(e.target.value)}
              placeholder="隊 1 分"
              className="cj-input h-11 text-center font-bold"
            />
            <Input
              type="number"
              min={0}
              value={team2Score}
              onChange={(e) => setTeam2Score(e.target.value)}
              placeholder="隊 2 分"
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
              記錄切磋
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
