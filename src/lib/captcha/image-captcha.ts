import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const LENGTH = 4;
const TTL_MS = 5 * 60 * 1000;

export type ImageCaptchaChallenge = {
  token: string;
  imageDataUrl: string;
};

function getCaptchaSecret(): string {
  return (
    process.env.CAPTCHA_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "khpa-dev-captcha-secret"
  );
}

function randomCaptchaText(): string {
  const bytes = randomBytes(LENGTH);
  let text = "";
  for (let i = 0; i < LENGTH; i++) {
    text += CHARSET[bytes[i]! % CHARSET.length];
  }
  return text;
}

function signPayload(answer: string, exp: number): string {
  const payload = JSON.stringify({ answer: answer.toLowerCase(), exp });
  const sig = createHmac("sha256", getCaptchaSecret())
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

function parseToken(token: string): { answer: string; exp: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const dot = decoded.lastIndexOf(".");
    if (dot === -1) return null;

    const payload = decoded.slice(0, dot);
    const sig = decoded.slice(dot + 1);
    const expected = createHmac("sha256", getCaptchaSecret())
      .update(payload)
      .digest("hex");

    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const data = JSON.parse(payload) as { answer?: string; exp?: number };
    if (!data.answer || typeof data.exp !== "number") return null;
    return { answer: data.answer, exp: data.exp };
  } catch {
    return null;
  }
}

function buildCaptchaSvg(text: string): string {
  const width = 160;
  const height = 56;
  const chars = [...text];
  const charWidth = width / (chars.length + 1);

  const noise = Array.from({ length: 6 }, (_, i) => {
    const x1 = (i * 27) % width;
    const y1 = (i * 11) % height;
    const x2 = (x1 + 40 + i * 13) % width;
    const y2 = (y1 + 20 + i * 7) % height;
    const color = `hsl(${(i * 47 + 180) % 360} 45% 55%)`;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" opacity="0.55"/>`;
  }).join("");

  const glyphs = chars
    .map((ch, i) => {
      const x = charWidth * (i + 0.75);
      const y = 36 + (i % 2 === 0 ? 2 : -2);
      const rotate = (i % 3 - 1) * 12;
      const fill = `hsl(${(i * 53 + 200) % 360} 55% 32%)`;
      return `<text x="${x}" y="${y}" fill="${fill}" font-size="30" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="700" transform="rotate(${rotate} ${x} ${y})">${ch}</text>`;
    })
    .join("");

  const dots = Array.from({ length: 18 }, (_, i) => {
    const cx = (i * 19 + 7) % width;
    const cy = (i * 13 + 5) % height;
    return `<circle cx="${cx}" cy="${cy}" r="1.2" fill="#94a3b8" opacity="0.7"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" rx="10" fill="#f1f5f9"/>
  ${noise}
  ${dots}
  ${glyphs}
</svg>`;
}

export function createImageCaptchaChallenge(): ImageCaptchaChallenge {
  const answer = randomCaptchaText();
  const exp = Date.now() + TTL_MS;
  const token = signPayload(answer, exp);
  const svg = buildCaptchaSvg(answer);
  const imageDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return { token, imageDataUrl };
}

export function verifyImageCaptcha(
  token: string | null | undefined,
  userAnswer: string | null | undefined,
): { ok: true } | { ok: false; error: string } {
  const trimmed = userAnswer?.trim();
  if (!token?.trim()) {
    return { ok: false, error: "驗證碼已過期，請重新整理" };
  }
  if (!trimmed) {
    return { ok: false, error: "請輸入圖形驗證碼" };
  }

  const payload = parseToken(token.trim());
  if (!payload) {
    return { ok: false, error: "驗證碼無效，請重新整理" };
  }
  if (Date.now() > payload.exp) {
    return { ok: false, error: "驗證碼已過期，請重新整理" };
  }
  if (trimmed.toLowerCase() !== payload.answer) {
    return { ok: false, error: "驗證碼錯誤" };
  }

  return { ok: true };
}
