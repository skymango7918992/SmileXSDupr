"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, UserRound } from "lucide-react";
import { ImageCaptchaField } from "@/components/khpa/image-captcha-field";
import { KhpaLogo } from "@/components/khpa/khpa-logo";
import { khpaSignIn } from "@/lib/actions/khpa-auth";
import { getKhpaUsername } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HOME = "/khpa";

export function KhpaLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState(getKhpaUsername());
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);

  const resetCaptcha = useCallback(() => {
    setCaptchaToken("");
    setCaptchaAnswer("");
    setCaptchaKey((k) => k + 1);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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

      router.replace(HOME);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <KhpaLogo size={88} className="mx-auto mb-4 ring-4 ring-primary/20" priority />
        <h1 className="text-xl font-bold text-foreground">
          高雄市匹克球協會
        </h1>
        <p className="mt-1 text-sm text-muted">KHPA 對戰管理平台</p>
      </div>

      <div className="glass-card-solid p-6">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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

          {error && <div className="alert-danger">{error}</div>}

          <Button
            type="submit"
            loading={loading}
            disabled={!captchaToken || !captchaAnswer.trim()}
            className="h-11 w-full"
          >
            登入協會平台
          </Button>
        </form>
      </div>
    </div>
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
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
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
        disabled={disabled}
        required
      />
    </div>
  );
}
