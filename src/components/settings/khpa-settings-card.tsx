"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, KeyRound } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { updateKhpaPassword } from "@/lib/actions/khpa-auth";
import type { KhpaAccountStatus } from "@/lib/actions/khpa-auth";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  account: KhpaAccountStatus;
};

export function KhpaSettingsCard({ account }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const { success, error: toastError } = useAppUi();

  const handleSavePassword = () => {
    if (password.length < 6) {
      toastError("密碼至少 6 個字元");
      return;
    }
    if (password !== confirmPassword) {
      toastError("兩次密碼不一致");
      return;
    }
    startTransition(async () => {
      try {
        await updateKhpaPassword(password);
        setPassword("");
        setConfirmPassword("");
        success(
          account.exists
            ? "協會密碼已更新"
            : "協會帳號已建立，請至 /khpa/login 登入",
        );
      } catch (e) {
        toastError(e instanceof Error ? e.message : "更新失敗");
      }
    });
  };

  return (
    <Card className="max-w-lg">
      <CardTitle className="mb-2 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-teal-600" />
        高雄匹克球協會帳號
      </CardTitle>
      <p className="mb-4 text-sm text-muted">
        協會人員共用帳號 <strong>{account.username}</strong>（
        {account.email}）。登入時需輸入圖形驗證碼，建議定期更換密碼。
      </p>

      <div className="mb-4 rounded-lg border border-border bg-surface-muted/40 px-3 py-2 text-sm">
        <p>
          狀態：
          {account.exists ? (
            <span className="text-success">已建立</span>
          ) : (
            <span className="text-warning">尚未建立，請設定密碼</span>
          )}
        </p>
        <Link
          href="/khpa/login"
          className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          協會登入入口 /khpa/login
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-muted">新密碼</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 個字元"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">確認密碼</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <Button
          onClick={handleSavePassword}
          loading={isPending}
          disabled={!password}
        >
          {account.exists ? "更新協會密碼" : "建立協會帳號"}
        </Button>
      </div>
    </Card>
  );
}
