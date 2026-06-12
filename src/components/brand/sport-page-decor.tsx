/** 登入後頁面背景：匹克球可愛裝飾 */
export function SportPageDecor() {
  return (
    <div
      className="sport-page-decor pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="sport-float sport-float--paddle" />
      <div className="sport-float sport-float--paddle-alt" />
      <div className="sport-float sport-float--ball-a" />
      <div className="sport-float sport-float--ball-b" />
      <div className="sport-float sport-float--ball-c" />
      <div className="sport-float sport-float--net" />
      <div className="pickle-spark pickle-spark--1">✦</div>
      <div className="pickle-spark pickle-spark--2">●</div>
      <div className="pickle-spark pickle-spark--3">✦</div>
    </div>
  );
}
