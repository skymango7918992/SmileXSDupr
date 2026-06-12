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

      <div className="login-page__inner">
        <aside className="login-page__brand hidden lg:flex">
          <div className="login-page__brand-content">
            <p className="login-page__eyebrow">星鑽 XS 匹克球</p>
            <h2 className="login-page__headline">
              場館級賽事管理
              <br />
              從報到到大滿貫
            </h2>
            <p className="login-page__subline">
              DUPR 計分 · 多賽程組 · 即時對戰表 · CSV 匯出
            </p>
          </div>
        </aside>

        <div className="login-page__form">{children}</div>
      </div>
    </div>
  );
}
