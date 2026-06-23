/** KHPA 協會頁面背景裝飾（匹克球元素） */
export function KhpaPageDecor() {
  return (
    <div className="khpa-page-decor pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="khpa-pickleball-pattern absolute inset-0 opacity-[0.04]" />
      <div className="khpa-court-lines absolute -right-20 top-24 h-64 w-64 opacity-[0.07]" />
      <div className="khpa-court-lines absolute -left-16 bottom-32 h-48 w-48 rotate-45 opacity-[0.06]" />
      <div className="khpa-net absolute left-1/2 top-1/3 h-px w-[70%] -translate-x-1/2 opacity-[0.06]" />
      <span className="khpa-ball khpa-ball--1" role="presentation">🎾</span>
      <span className="khpa-ball khpa-ball--2" role="presentation">🎾</span>
      <span className="khpa-ball khpa-ball--3" role="presentation">🎾</span>
    </div>
  );
}
