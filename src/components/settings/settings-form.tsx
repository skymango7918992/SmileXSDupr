"use client";

import { useState, useTransition } from "react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { revokeTrustedDevices } from "@/lib/actions/trusted-device";
import { updateSettings } from "@/lib/actions/settings";
import type { AppSettings } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  initialSettings: AppSettings | null;
  className?: string;
};

export function SettingsForm({ initialSettings, className }: Props) {
  const [teamName, setTeamName] = useState(
    initialSettings?.team_name ?? "星鑽 XS 匹克球",
  );
  const [courtCount, setCourtCount] = useState(
    initialSettings?.default_court_count ?? 4,
  );
  const [trustedDeviceDays, setTrustedDeviceDays] = useState(
    initialSettings?.trusted_device_days ?? 7,
  );
  const [xsDuprClubId, setXsDuprClubId] = useState(
    initialSettings?.xs_dupr_club_id ?? "4668804565",
  );
  const [khpaDuprClubId, setKhpaDuprClubId] = useState(
    initialSettings?.khpa_dupr_club_id ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { success, error: toastError, confirm } = useAppUi();

  const handleSave = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await updateSettings({
          team_name: teamName,
          default_court_count: courtCount,
          trusted_device_days: trustedDeviceDays,
          xs_dupr_club_id: xsDuprClubId,
          khpa_dupr_club_id: khpaDuprClubId,
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
    <Card className={cn("w-full max-w-lg", className)}>
      <CardTitle className="mb-4">應用設定</CardTitle>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-muted">球隊名稱</label>
          <Input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">預設排場場數</label>
          <Input
            type="number"
            min={1}
            max={20}
            value={courtCount}
            onChange={(e) => setCourtCount(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">
            信任此裝置天數
          </label>
          <Input
            type="number"
            min={1}
            max={365}
            value={trustedDeviceDays}
            onChange={(e) => setTrustedDeviceDays(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-muted">
            登入 OTP 後勾選「信任此裝置」的有效期限（預設 7 天）。僅影響新註冊的信任裝置。
          </p>
        </div>

        <div className="border-t border-divider pt-4">
          <p className="mb-3 text-sm font-semibold text-foreground">DUPR Club ID</p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted">
                星鑽 XS Club ID
              </label>
              <Input
                value={xsDuprClubId}
                onChange={(e) => setXsDuprClubId(e.target.value)}
                placeholder="4668804565"
                inputMode="numeric"
              />
              <p className="mt-1 text-xs text-muted">
                星鑽 XS 球員管理「更新 Club 名單」使用此 ID。
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">
                協會 Club ID
              </label>
              <Input
                value={khpaDuprClubId}
                onChange={(e) => setKhpaDuprClubId(e.target.value)}
                placeholder="協會申請完成後填入"
                inputMode="numeric"
              />
              <p className="mt-1 text-xs text-muted">
                高雄匹克球協會球員頁同步使用；尚未申請可留空。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={handleSave} loading={isPending}>
          儲存設定
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => {
            void (async () => {
              const ok = await confirm({
                title: "清除所有信任裝置？",
                description:
                  "所有已信任的手機／電腦需重新輸入 OTP。目前這台裝置也會一併清除。",
                confirmLabel: "全部清除",
                variant: "danger",
              });
              if (!ok) return;
              startTransition(async () => {
                try {
                  await revokeTrustedDevices();
                  success("已清除所有信任裝置");
                } catch (e) {
                  toastError(
                    e instanceof Error ? e.message : "清除失敗",
                  );
                }
              });
            })();
          }}
        >
          清除信任裝置
        </Button>
      </div>

      {message && <p className="mt-3 text-sm text-success">{message}</p>}
      {error && <p className="alert-danger mt-3">{error}</p>}
    </Card>
  );
}
