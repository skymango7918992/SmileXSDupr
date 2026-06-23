export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="login-page">
      <div className="login-page__photos" aria-hidden="true">
        <div className="login-page__photo login-page__photo--a" />
        <div className="login-page__photo login-page__photo--b" />
      </div>
      <div className="login-page__scrim" aria-hidden="true" />
      <div className="login-page__pitch-glow" aria-hidden="true" />

      <div className="login-page__inner">
        <div className="login-page__mobile-strip lg:hidden">
          <span className="login-page__live-dot" aria-hidden />
          <span>匹克球官方賽事管理平台</span>
        </div>

        <aside className="login-page__brand hidden lg:flex">
          <div className="login-page__brand-content">
            <p className="login-page__eyebrow">
              <span className="login-page__live-dot" aria-hidden />
              OFFICIAL TOURNAMENT PLATFORM
            </p>
            <h2 className="login-page__headline">
              高雄市匹克球協會
              <br />
              <span className="login-page__headline-accent">星鑽 XS 匹克球</span>
            </h2>
            <p className="login-page__subline">
              世界級賽事體驗 · 即時對戰紀錄 · DUPR 官方匯出
            </p>
            <ul className="login-page__features" aria-label="平台特色">
              <li>協會對戰榮耀榜</li>
              <li>多賽程智慧排場</li>
              <li>獎章成就系統</li>
            </ul>
          </div>
        </aside>

        <div className="login-page__form">{children}</div>
      </div>
    </div>
  );
}
