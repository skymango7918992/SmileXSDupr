"use client";

import { useState, useTransition } from "react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { updateSettings } from "@/lib/actions/settings";
import type { AppSettings } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  initialSettings: AppSettings | null;
};

export function SettingsForm({ initialSettings }: Props) {
  const [teamName, setTeamName] = useState(
    initialSettings?.team_name ?? "星鑽 XS 匹克球",
  );
  const [courtCount, setCourtCount] = useState(
    initialSettings?.default_court_count ?? 4,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { success, error: toastError } = useAppUi();

  const handleSave = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await updateSettings({
          team_name: teamName,
          default_court_count: courtCount,
        });
        setMessage("設定已儲存");
        success("設定已儲存");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "儲存失敗";
        setError(msg);
        toastError(msg);
      }
    });
  };

  return (
    <Card className="max-w-lg">
      <CardTitle className="mb-4">應用設定</CardTitle>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-gray-500">球隊名稱</label>
          <Input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">
            預設排場場數
          </label>
          <Input
            type="number"
            min={1}
            max={20}
            value={courtCount}
            onChange={(e) => setCourtCount(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={handleSave} loading={isPending}>
          儲存設定
        </Button>
      </div>

      {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
