/**
 * 匹克球拍造型：寬扁實心拍面 + 圓角 + 短握把（非網球球拍）
 * 參考實拍：直立的長方形拍頭、下方細握把
 */

/** 直立球拍，viewBox 0 0 32 48 */
export const PICKLEBALL_PADDLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" fill="none">
  <rect x="3" y="1" width="26" height="30" rx="5" fill="#0284C7"/>
  <rect x="4.5" y="2.5" width="23" height="27" rx="4" fill="#0ea5e9" opacity="0.35"/>
  <line x1="8" y1="8" x2="22" y2="24" stroke="#BAE6FD" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
  <line x1="10" y1="6" x2="18" y2="20" stroke="#FFFFFF" stroke-width="0.8" stroke-linecap="round" opacity="0.45"/>
  <rect x="11" y="30" width="10" height="16" rx="3" fill="#475569"/>
  <rect x="12" y="31" width="8" height="14" rx="2.5" fill="#94A3B8"/>
  <rect x="12.5" y="32" width="7" height="3" rx="1" fill="#E2E8F0" opacity="0.6"/>
</svg>`;

/** 深藍變體 */
export const PICKLEBALL_PADDLE_SVG_ALT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" fill="none">
  <rect x="3" y="1" width="26" height="30" rx="5" fill="#0369A1"/>
  <rect x="4.5" y="2.5" width="23" height="27" rx="4" fill="#0284C7" opacity="0.4"/>
  <line x1="9" y1="9" x2="21" y2="23" stroke="#7DD3FC" stroke-width="1.2" stroke-linecap="round" opacity="0.65"/>
  <rect x="11" y="30" width="10" height="16" rx="3" fill="#334155"/>
  <rect x="12" y="31" width="8" height="14" rx="2.5" fill="#64748B"/>
</svg>`;

/** 球拍 + 球 組合 64x64（背景裝飾用） */
export const PADDLE_BALL_SCENE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <g transform="translate(14 6) rotate(-6)">
    <rect x="0" y="0" width="22" height="26" rx="4.5" fill="#0284C7"/>
    <line x1="5" y1="6" x2="17" y2="20" stroke="#BAE6FD" stroke-width="1.2" opacity="0.65"/>
    <rect x="7" y="25" width="8" height="14" rx="2.5" fill="#64748B"/>
  </g>
  <circle cx="46" cy="44" r="11" fill="#FACC15"/>
  <circle cx="43" cy="42" r="1.8" fill="#A16207" opacity="0.5"/>
  <circle cx="49" cy="41" r="1.3" fill="#A16207" opacity="0.5"/>
  <circle cx="46" cy="47" r="1.5" fill="#A16207" opacity="0.5"/>
</svg>`;

export function svgToDataUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
