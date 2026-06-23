export default function KhpaRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="page-canvas khpa-pro flex min-h-screen flex-col">
      {children}
    </div>
  );
}
