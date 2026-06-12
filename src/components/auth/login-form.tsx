"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { TrustDeviceCheckbox } from "@/components/auth/trust-device-checkbox";
import { useAppUi } from "@/components/providers/app-ui-provider";
import {
  isCurrentDeviceTrusted,
  registerTrustedDevice,
} from "@/lib/actions/trusted-device";
import { usernameToEmail } from "@/lib/auth/config";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "credentials" | "verify";

type Props = {
  trustedDeviceDays?: number;
};

export function LoginForm({ trustedDeviceDays = 7 }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [trustDevice, setTrustDevice] = useState(true);
  const { info, success } = useAppUi();

  useEffect(() => {
    if (searchParams.get("step") === "verify") {
      setStep("verify");
      void prepareMfaChallenge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const prepareMfaChallenge = async () => {
    const supabase = createClient();
    const { data: factors, error: factorError } =
      await supabase.auth.mfa.listFactors();

    if (factorError) {
      setError(factorError.message);
      return;
    }

    const totp = factors?.totp?.[0];
    if (!totp) {
      router.replace("/login/setup");
      return;
    }

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: totp.id });

    if (challengeError) {
      setError(challengeError.message);
      return;
    }

    setFactorId(totp.id);
    setChallengeId(challenge.id);
    setStep("verify");
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusText("正在驗證帳號…");
    setLoading(true);

    try {
      const email = usernameToEmail(username);
      if (!email) {
        setError("帳號或密碼錯誤");
        setStatusText(null);
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("帳號或密碼錯誤");
        setStatusText(null);
        return;
      }

      setStatusText("帳密正確，檢查雙因素驗證…");

      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (!factors?.totp?.length) {
        info("首次登入，請完成驗證器綁定");
        router.replace("/login/setup");
        return;
      }

      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        const trusted = await isCurrentDeviceTrusted();
        if (trusted) {
          setStatusText("已識別信任裝置，進入系統…");
          success(`信任裝置有效，已略過 OTP（${trustedDeviceDays} 天）`);
          router.replace("/");
          router.refresh();
          return;
        }
        setStatusText("請輸入 Google 驗證器 6 位數驗證碼");
        info("請輸入驗證器 OTP");
        await prepareMfaChallenge();
        return;
      }

      setStatusText("登入成功，進入系統…");
      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
      setStatusText(null);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || !challengeId) {
      setError("驗證流程異常，請重新登入");
      return;
    }

    setError(null);
    setStatusText("正在驗證 OTP…");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: otp.trim(),
      });

      if (verifyError) {
        setError("驗證碼錯誤或已過期，請重試");
        setStatusText(null);
        await prepareMfaChallenge();
        setOtp("");
        return;
      }

      await supabase.auth.getSession();
      router.refresh();

      setStatusText("驗證成功，進入系統…");
      router.replace("/");
      router.refresh();

      if (trustDevice) {
        const result = await registerTrustedDevice();
        if (result.ok) {
          success(`已信任此裝置 ${trustedDeviceDays} 天`);
        } else {
          info(result.message);
        }
      }
    } finally {
      setLoading(false);
      setStatusText(null);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-xl font-black text-slate-900 shadow-xl shadow-amber-500/30">
          XS
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          星鑽 XS 匹克球
        </h1>
        <p className="mt-2 text-sm text-emerald-100/80">
          專業 DUPR 賽事管理系統
        </p>
      </div>

      <div className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex gap-2">
          <StepBadge active={step === "credentials"} label="1. 帳密" />
          <StepBadge active={step === "verify"} label="2. OTP 驗證" />
        </div>

        {step === "credentials" ? (
          <form onSubmit={(e) => void handleCredentials(e)} className="space-y-4">
            <Field
              icon={<UserRound className="h-4 w-4" />}
              label="帳號"
              value={username}
              onChange={setUsername}
              placeholder="Smile"
              autoComplete="username"
              disabled={loading}
            />
            <Field
              icon={<KeyRound className="h-4 w-4" />}
              label="密碼"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
            />
            {error && <ErrorBox message={error} />}
            {statusText && !error && (
              <p className="text-center text-xs text-emerald-100/90">{statusText}</p>
            )}
            <Button
              type="submit"
              loading={loading}
              className="h-11 w-full shadow-lg shadow-emerald-900/30"
            >
              {loading ? "處理中…" : "下一步"}
            </Button>
          </form>
        ) : (
          <form onSubmit={(e) => void handleVerifyOtp(e)} className="space-y-4">
            <div className="rounded-2xl border border-emerald-200/30 bg-emerald-900/20 p-4 text-sm text-emerald-50">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4" />
                Google 驗證器 OTP
              </div>
              <p className="text-emerald-100/80">
                請開啟手機上的 Google Authenticator（或其他驗證器 App），輸入
                6 位數驗證碼。
              </p>
            </div>
            <Field
              icon={<Sparkles className="h-4 w-4" />}
              label="驗證碼"
              value={otp}
              onChange={setOtp}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              disabled={loading}
            />
            {error && <ErrorBox message={error} />}
            <TrustDeviceCheckbox
              checked={trustDevice}
              onChange={setTrustDevice}
              days={trustedDeviceDays}
              disabled={loading}
            />
            {statusText && !error && (
              <p className="text-center text-xs text-emerald-100/90">{statusText}</p>
            )}
            <Button
              type="submit"
              loading={loading}
              disabled={otp.length < 6}
              className="h-11 w-full shadow-lg shadow-emerald-900/30"
            >
              {loading ? "驗證中…" : "登入系統"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-emerald-100 hover:bg-white/10 hover:text-white"
              onClick={() => {
                setStep("credentials");
                setOtp("");
                setError(null);
              }}
            >
              返回帳密登入
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function StepBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={
        active
          ? "flex-1 rounded-xl bg-white/20 py-2 text-center text-xs font-semibold text-white"
          : "flex-1 rounded-xl bg-white/5 py-2 text-center text-xs text-emerald-100/60"
      }
    >
      {label}
    </span>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  inputMode,
  maxLength,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-100">
        {icon}
        {label}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        disabled={disabled}
        className="border-white/20 bg-white/90 disabled:opacity-60"
        required
      />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-300/50 bg-red-500/20 px-3 py-2 text-sm text-red-100">
      {message}
    </div>
  );
}
