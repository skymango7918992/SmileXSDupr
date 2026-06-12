"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, ShieldCheck } from "lucide-react";
import { TrustDeviceCheckbox } from "@/components/auth/trust-device-checkbox";
import { useAppUi } from "@/components/providers/app-ui-provider";
import { registerTrustedDevice } from "@/lib/actions/trusted-device";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  trustedDeviceDays?: number;
};

export function MfaSetupForm({ trustedDeviceDays = 7 }: Props) {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const { success } = useAppUi();

  useEffect(() => {
    void startEnrollment();
  }, []);

  const startEnrollment = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Google Authenticator",
      });

      if (enrollError) {
        setError(enrollError.message);
        return;
      }

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: otp.trim(),
      });

      if (verifyError) {
        setError("驗證碼錯誤，請確認 Google Authenticator 時間是否正確");
        return;
      }

      if (trustDevice) {
        await registerTrustedDevice();
        success(`已信任此裝置 ${trustedDeviceDays} 天`);
      }

      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white">綁定 OTP 驗證器</h1>
        <p className="mt-2 text-sm text-emerald-100/80">
          首次登入需綁定 Google Authenticator；可選擇信任此裝置以略過後續 OTP
        </p>
      </div>

      <div className="space-y-5 rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
        <div className="rounded-2xl border border-emerald-200/30 bg-emerald-900/20 p-4 text-sm text-emerald-50">
          <div className="mb-2 flex items-center gap-2 font-medium">
            <QrCode className="h-4 w-4" />
            步驟 1：掃描 QR Code
          </div>
          <p className="text-emerald-100/80">
            使用 Google Authenticator 掃描下方 QR Code，或手動輸入金鑰。
          </p>
        </div>

        {qrCode ? (
          <div
            className="mx-auto flex w-fit items-center justify-center rounded-2xl bg-white p-4"
            dangerouslySetInnerHTML={{ __html: qrCode }}
          />
        ) : (
          <div className="flex h-48 items-center justify-center rounded-2xl bg-white/10 text-sm text-emerald-100">
            {loading ? "產生 QR Code 中..." : "無法載入 QR Code"}
          </div>
        )}

        {secret && (
          <div className="rounded-xl bg-black/20 px-3 py-2 text-center font-mono text-xs text-emerald-100">
            手動金鑰：{secret}
          </div>
        )}

        <form onSubmit={(e) => void handleVerify(e)} className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              步驟 2：輸入驗證器顯示的 6 位數
            </label>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              className="border-white/20 bg-white/90 text-center text-lg tracking-[0.3em]"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-300/50 bg-red-500/20 px-3 py-2 text-sm text-red-100">
              {error}
            </div>
          )}

          <TrustDeviceCheckbox
            checked={trustDevice}
            onChange={setTrustDevice}
            days={trustedDeviceDays}
            disabled={loading}
          />

          <Button
            type="submit"
            loading={loading}
            disabled={otp.length < 6}
            className="h-11 w-full"
          >
            {loading ? "驗證中…" : "完成綁定並進入系統"}
          </Button>
        </form>
      </div>
    </div>
  );
}
