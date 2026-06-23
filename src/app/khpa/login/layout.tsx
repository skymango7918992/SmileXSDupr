export default function KhpaLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-[1] flex min-h-[100dvh] w-full items-center justify-center px-4 py-8">
      {children}
    </div>
  );
}
