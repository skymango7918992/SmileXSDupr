export default function KhpaRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="page-canvas khpa-pro flex min-h-[100dvh] w-full max-w-[100vw] flex-col overflow-x-clip">
      {children}
    </div>
  );
}
