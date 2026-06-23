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
            <p className="login-page__eyebrow">匹克球賽事管理</p>
            <h2 className="login-page__headline">
              高雄市匹克球協會
              <br />
              星鑽 XS 匹克球
            </h2>
            <p className="login-page__subline">
              協會對戰紀錄 · 圖形驗證碼登入
              <br />
              DUPR 計分 · 多賽程組 · CSV 匯出
            </p>
          </div>
        </aside>

        <div className="login-page__form">{children}</div>
      </div>
    </div>
  );
}
