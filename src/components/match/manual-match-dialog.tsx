"use client";

import { useState } from "react";
import type { Player } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

type Props = {
  players: Player[];
  selectedPlayerIds: string[];
  onSubmit: (
    team1: [string, string],
    team2: [string, string],
  ) => Promise<void>;
  onClose: () => void;
};

export function ManualMatchDialog({
  players,
  selectedPlayerIds,
  onSubmit,
  onClose,
}: Props) {
  const available =
    selectedPlayerIds.length >= 4
      ? players.filter((p) => selectedPlayerIds.includes(p.id))
      : players;

  const [team1p1, setTeam1p1] = useState("");
  const [team1p2, setTeam1p2] = useState("");
  const [team2p1, setTeam2p1] = useState("");
  const [team2p2, setTeam2p2] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const ids = [team1p1, team1p2, team2p1, team2p2];
    if (ids.some((id) => !id)) {
      alert("請選滿 4 位球員");
      return;
    }
    if (new Set(ids).size !== 4) {
      alert("同一位球員不能重複出場");
      return;
    }

    setLoading(true);
    try {
      await onSubmit([team1p1, team1p2], [team2p1, team2p2]);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const selectClass =
    "h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-lg">
        <CardTitle className="mb-4">手動新增對戰</CardTitle>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">隊伍 1</p>
            <div className="space-y-2">
              <select
                className={selectClass}
                value={team1p1}
                onChange={(e) => setTeam1p1(e.target.value)}
              >
                <option value="">選擇球員 1</option>
                {available.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.dupr_id})
                  </option>
                ))}
              </select>
              <select
                className={selectClass}
                value={team1p2}
                onChange={(e) => setTeam1p2(e.target.value)}
              >
                <option value="">選擇球員 2</option>
                {available.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.dupr_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">隊伍 2</p>
            <div className="space-y-2">
              <select
                className={selectClass}
                value={team2p1}
                onChange={(e) => setTeam2p1(e.target.value)}
              >
                <option value="">選擇球員 1</option>
                {available.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.dupr_id})
                  </option>
                ))}
              </select>
              <select
                className={selectClass}
                value={team2p2}
                onChange={(e) => setTeam2p2(e.target.value)}
              >
                <option value="">選擇球員 2</option>
                {available.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.dupr_id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={loading}>
            新增
          </Button>
        </div>
      </Card>
    </div>
  );
}
