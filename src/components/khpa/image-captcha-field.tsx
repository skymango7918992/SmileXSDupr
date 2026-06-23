"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { getKhpaCaptchaChallenge } from "@/lib/actions/khpa-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  token: string;
  answer: string;
  onTokenChange: (token: string) => void;
  onAnswerChange: (answer: string) => void;
  disabled?: boolean;
};

export function ImageCaptchaField({
  token,
  answer,
  onTokenChange,
  onAnswerChange,
  disabled,
}: Props) {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    setLoadError(null);
    onAnswerChange("");
    startTransition(async () => {
      try {
        const challenge = await getKhpaCaptchaChallenge();
        onTokenChange(challenge.token);
        setImageDataUrl(challenge.imageDataUrl);
      } catch {
        setLoadError("無法載入驗證碼，請重試");
        onTokenChange("");
        setImageDataUrl(null);
      }
    });
  }, [onAnswerChange, onTokenChange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted">
        <ShieldCheck className="h-4 w-4" />
        圖形驗證碼
      </label>

      <div className="flex items-center gap-2">
        <div className="flex h-14 min-w-[10rem] flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-muted/50">
          {imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageDataUrl}
              alt="圖形驗證碼"
              className="h-full w-auto select-none"
              draggable={false}
            />
          ) : (
            <span className="text-xs text-muted">
              {isPending ? "載入中…" : "驗證碼載入失敗"}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="btn-touch h-14 shrink-0 px-3"
          onClick={refresh}
          disabled={disabled || isPending}
          aria-label="換一組驗證碼"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Input
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value.toUpperCase())}
        placeholder="請輸入圖中文字"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={6}
        disabled={disabled || !token}
        className="h-11 uppercase tracking-widest"
        required
      />

      {loadError && <p className="text-xs text-danger">{loadError}</p>}
    </div>
  );
}
