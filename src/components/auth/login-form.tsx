"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { ImageCaptchaField } from "@/components/khpa/image-captcha-field";
import { KhpaLogo } from "@/components/khpa/khpa-logo";
import { TrustDeviceCheckbox } from "@/components/auth/trust-device-checkbox";
import { useAppUi } from "@/components/providers/app-ui-provider";
import {
  isCurrentDeviceTrusted,
  registerTrustedDevice,
} from "@/lib/actions/trusted-device";
import { khpaSignIn } from "@/lib/actions/khpa-auth";
import { xsStaffSignIn } from "@/lib/actions/xs-staff-auth";
import {
  getAdminUsername,
  getKhpaUsername,
  getStaffUsername,
  isValidStaffUsername,
  type LoginPortal,
  type XsLoginMode,
  usernameToEmail,
} from "@/lib/auth/config";
import { khpaHomePath } from "@/lib/khpa/paths";
import { createClient } from "@/lib/supabase/client";
import { ClubLogo } from "@/components/brand/club-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Step = "credentials" | "verify";

type Props = {
  trustedDeviceDays?: number;
};

export function LoginForm({ trustedDeviceDays = 7 }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [portal, setPortal] = useState<LoginPortal>("khpa");
  const [xsMode, setXsMode] = useState<XsLoginMode>("admin");
  const [step, setStep] = useState<Step>("credentials");
  const [username, setUsername] = useState(getKhpaUsername());
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [trustDevice, setTrustDevice] = useState(true);
  const { info, success } = useAppUi();

  const resetCaptcha = useCallback(() => {
    setCaptchaToken("");
    setCaptchaAnswer("");
    setCaptchaKey((k) => k + 1);
  }, []);

  const switchPortal = (next: LoginPortal) => {
    setPortal(next);
    setXsMode("admin");
    setStep("credentials");
    setError(null);
    setStatusText(null);
    setOtp("");
    resetCaptcha();
    setUsername(next === "khpa" ? getKhpaUsername() : getAdminUsername());
  };

  const switchXsMode = (next: XsLoginMode) => {
    setXsMode(next);
    setStep("credentials");
    setError(null);
    setStatusText(null);
    setOtp("");
    resetCaptcha();
    setUsername(next === "staff" ? getStaffUsername() : getAdminUsername());
  };

  useEffect(() => {
    const platform = searchParams.get("platform");
    const mode = searchParams.get("mode");
    if (platform === "xs") {
      switchPortal("xs");
      if (mode === "staff") switchXsMode("staff");
    } else if (platform === "khpa") switchPortal("khpa");
    if (searchParams.get("step") === "verify") {
      setPortal("xs");
      setXsMode("admin");
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

  const handleKhpaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!captchaToken || !captchaAnswer.trim()) {
      setError("請輸入圖形驗證碼");
      return;
    }

    setLoading(true);
    try {
      const result = await khpaSignIn({
        username,
        password,
        captchaToken,
        captchaAnswer,
      });

      if (!result.ok) {
        setError(result.message);
        resetCaptcha();
        return;
      }

      router.replace(khpaHomePath());
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleXsStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!captchaToken || !captchaAnswer.trim()) {
      setError("請輸入圖形驗證碼");
      return;
    }

    setLoading(true);
    try {
      const result = await xsStaffSignIn({
        username,
        password,
        captchaToken,
        captchaAnswer,
      });

      if (!result.ok) {
        setError(result.message);
        resetCaptcha();
        return;
      }

      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleXsCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusText("正在驗證帳號…");
    setLoading(true);

    try {
      if (isValidStaffUsername(username)) {
        setError("請切換至「一般使用者」分頁登入");
        setStatusText(null);
        return;
      }

      const email = usernameToEmail(username, "xs");
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
    <div className="login-page-shell w-full min-w-0 max-w-md sm:max-w-lg">
      <div
        className="login-portal-tabs mb-4 grid grid-cols-2 gap-1.5 rounded-xl p-1.5"
        role="tablist"
        aria-label="選擇登入平台"
      >
        <PortalTab
          active={portal === "khpa"}
          onClick={() => switchPortal("khpa")}
          label="協會"
          labelWide="高雄市匹克球協會"
          logo={<KhpaLogo size={32} className="shrink-0 ring-2 ring-primary/15" />}
        />
        <PortalTab
          active={portal === "xs"}
          onClick={() => switchPortal("xs")}
          label="星鑽 XS"
          labelWide="星鑽 XS 匹克球"
          logo={<ClubLogo size={32} className="shrink-0 ring-2 ring-white/80" />}
        />
      </div>

      <div
        className={cn(
          "login-portal-hero relative mb-4 overflow-hidden rounded-2xl px-4 py-6 text-center sm:mb-5 sm:px-6 sm:py-7",
          portal === "khpa" ? "login-portal-hero--khpa" : "login-portal-hero--xs",
        )}
      >
        <div className="login-portal-hero__shine" aria-hidden />
        <div className="login-portal-hero__stripes" aria-hidden />

        {portal === "khpa" ? (
          <KhpaLogo
            size={76}
            className="relative z-[1] mx-auto mb-3 ring-4 ring-white/35 shadow-lg sm:mb-4"
            priority
          />
        ) : (
          <ClubLogo
            size={76}
            className="relative z-[1] mx-auto mb-3 ring-4 ring-white/40 shadow-lg sm:mb-4"
            priority
          />
        )}

        <p className="login-portal-hero__badge">
          <span className="login-portal-hero__live" aria-hidden />
          {portal === "khpa" ? "官方協會賽事平台" : "DUPR 認證賽事系統"}
        </p>

        <h1 className="login-portal-hero__title">
          {portal === "khpa" ? "高雄市匹克球協會" : "星鑽 XS 匹克球"}
        </h1>

        <p className="login-portal-hero__tagline">
          {portal === "khpa"
            ? "協會對戰管理 · 榮耀殿堂"
            : "專業 DUPR 賽事管理系統"}
        </p>
      </div>

      <div
        className={cn(
          "glass-card-solid p-4 sm:p-6",
          portal === "khpa" ? "login-form-card--khpa" : "login-form-card--xs",
        )}
      >
        {portal === "xs" && (
          <div
            className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-surface-muted/80 p-1"
            role="tablist"
            aria-label="星鑽 XS 登入身分"
          >
            <button
              type="button"
              role="tab"
              aria-selected={xsMode === "admin"}
              onClick={() => switchXsMode("admin")}
              className={cn(
                "btn-touch rounded-md px-2 py-2 text-xs font-semibold transition-colors sm:text-sm",
                xsMode === "admin"
                  ? "glass-nav-active"
                  : "text-muted hover:bg-surface hover:text-foreground",
              )}
            >
              管理員
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={xsMode === "staff"}
              onClick={() => switchXsMode("staff")}
              className={cn(
                "btn-touch rounded-md px-2 py-2 text-xs font-semibold transition-colors sm:text-sm",
                xsMode === "staff"
                  ? "glass-nav-active"
                  : "text-muted hover:bg-surface hover:text-foreground",
              )}
            >
              一般使用者
            </button>
          </div>
        )}

        {portal === "xs" && xsMode === "admin" && step === "verify" && (
          <div className="mb-4 flex gap-2">
            <StepBadge active={false} label="1. 帳密" />
            <StepBadge active label="2. OTP 驗證" />
          </div>
        )}

        {portal === "khpa" ? (
          <form onSubmit={(e) => void handleKhpaSubmit(e)} className="space-y-4">
            <Field
              icon={<UserRound className="h-4 w-4" />}
              label="帳號"
              value={username}
              onChange={setUsername}
              placeholder="KHPA"
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
            <ImageCaptchaField
              key={captchaKey}
              token={captchaToken}
              answer={captchaAnswer}
              onTokenChange={setCaptchaToken}
              onAnswerChange={setCaptchaAnswer}
              disabled={loading}
            />
            {error && <ErrorBox message={error} />}
            <Button
              type="submit"
              loading={loading}
              disabled={!captchaToken || !captchaAnswer.trim()}
              className="login-submit--khpa h-11 w-full"
            >
              登入協會平台
            </Button>
          </form>
        ) : portal === "xs" && xsMode === "staff" ? (
          <form onSubmit={(e) => void handleXsStaffSubmit(e)} className="space-y-4">
            <Field
              icon={<UserRound className="h-4 w-4" />}
              label="帳號"
              value={username}
              onChange={setUsername}
              placeholder="user"
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
            <ImageCaptchaField
              key={captchaKey}
              token={captchaToken}
              answer={captchaAnswer}
              onTokenChange={setCaptchaToken}
              onAnswerChange={setCaptchaAnswer}
              disabled={loading}
            />
            {error && <ErrorBox message={error} />}
            <Button
              type="submit"
              loading={loading}
              disabled={!captchaToken || !captchaAnswer.trim()}
              className="h-11 w-full"
            >
              登入星鑽 XS
            </Button>
          </form>
        ) : step === "credentials" ? (
          <form onSubmit={(e) => void handleXsCredentials(e)} className="space-y-4">
            <div className="mb-2 flex gap-2">
              <StepBadge active label="1. 帳密" />
              <StepBadge active={false} label="2. OTP 驗證" />
            </div>
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
              <p className="text-center text-xs text-muted">{statusText}</p>
            )}
            <Button type="submit" loading={loading} className="h-11 w-full">
              {loading ? "處理中…" : "下一步"}
            </Button>
          </form>
        ) : (
          <form onSubmit={(e) => void handleVerifyOtp(e)} className="space-y-4">
            <div className="rounded-[10px] border border-border bg-surface-muted/40 p-4 text-sm text-foreground">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Google 驗證器 OTP
              </div>
              <p className="text-muted">
                請開啟手機上的 Google Authenticator，輸入 6 位數驗證碼。
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
              <p className="text-center text-xs text-muted">{statusText}</p>
            )}
            <Button
              type="submit"
              loading={loading}
              disabled={otp.length < 6}
              className="h-11 w-full"
            >
              {loading ? "驗證中…" : "登入星鑽 XS"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
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

function PortalTab({
  active,
  onClick,
  label,
  labelWide,
  logo,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  labelWide: string;
  logo: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "btn-touch flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2.5 transition-all",
        active
          ? "login-portal-tab--active shadow-md"
          : "text-muted hover:bg-white/60 hover:text-foreground",
      )}
    >
      {logo}
      <span className="min-w-0 truncate text-sm font-semibold sm:hidden">{label}</span>
      <span className="hidden min-w-0 truncate text-sm font-semibold sm:inline">
        {labelWide}
      </span>
    </button>
  );
}

function StepBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={
        active
          ? "glass-nav-active flex-1 py-2 text-center text-xs font-medium text-foreground"
          : "flex-1 rounded-[8px] bg-surface-muted py-2 text-center text-xs text-muted"
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
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted">
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
        required
      />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return <div className="alert-danger">{message}</div>;
}
