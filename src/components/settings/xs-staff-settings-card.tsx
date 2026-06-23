"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, KeyRound } from "lucide-react";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { updateXsStaffPassword } from "@/lib/actions/xs-staff-auth";
import type { XsStaffAccountStatus } from "@/lib/actions/xs-staff-auth";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  account: XsStaffAccountStatus;
};

export function XsStaffSettingsCard({ account }: Props) {
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
        await updateXsStaffPassword(password);
        setPassword("");
        setConfirmPassword("");
        success(
          account.exists
            ? "一般使用者密碼已更新"
            : "一般使用者帳號已建立，請至 /login 登入",
        );
      } catch (e) {
        toastError(e instanceof Error ? e.message : "更新失敗");
      }
    });
  };

  return (
    <Card className="max-w-lg">
      <CardTitle className="mb-2 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        星鑽 XS 一般使用者帳號
      </CardTitle>
      <p className="mb-4 text-sm text-muted">
        現場人員共用帳號 <strong>{account.username}</strong>（
        {account.email}）。登入時需輸入圖形驗證碼，無法進入打球軌跡與報到收款。
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
          href="/login?platform=xs&mode=staff"
          className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          一般使用者登入入口 /login
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
          {account.exists ? "更新一般使用者密碼" : "建立一般使用者帳號"}
        </Button>
      </div>
    </Card>
  );
}
