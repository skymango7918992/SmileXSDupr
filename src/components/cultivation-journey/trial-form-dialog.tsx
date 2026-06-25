"use client";

import { useEffect, useState } from "react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  onSubmit: (input: {
    occurred_on: string;
    venue_name: string;
    trial_wins: number;
    trial_losses: number;
    notes?: string;
  }) => Promise<void>;
  onClose: () => void;
};

export function TrialFormDialog({ onSubmit, onClose }: Props) {
  const [occurredOn, setOccurredOn] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [venue, setVenue] = useState("");
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
    if (!venue.trim()) {
      toastError("請填寫試煉地點／賽事名稱");
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
        venue_name: venue,
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <div className="glass-overlay absolute inset-0" aria-hidden onClick={onClose} />
      <Card className="glass-modal relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl">
        <div className="border-b border-divider px-4 py-3">
          <CardTitle className="text-base">天榜試煉</CardTitle>
          <p className="text-xs text-muted">正式 DUPR 比賽 · 完成 +15，每勝 +5</p>
        </div>
        <div className="space-y-3 px-4 py-3">
          <Input type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} className="h-11" />
          <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="賽事／地點" className="h-11" />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" min={0} value={wins} onChange={(e) => setWins(e.target.value)} placeholder="勝場" className="h-11 text-center font-bold" />
            <Input type="number" min={0} value={losses} onChange={(e) => setLosses(e.target.value)} placeholder="敗場" className="h-11 text-center font-bold" />
          </div>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="心得（選填）" className="h-11" />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">取消</Button>
            <Button onClick={() => void handleSubmit()} loading={loading} className="flex-1">記錄試煉</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
