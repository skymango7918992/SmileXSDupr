export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(215,178,127,0.25),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.2),transparent_35%),linear-gradient(135deg,#0b3b2f_0%,#145a45_45%,#0a2f25_100%)]" />
      <div className="pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />

      {/* 球場線條裝飾 */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white" />
        <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}
