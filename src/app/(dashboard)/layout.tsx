import { SportPageDecor } from "@/components/brand/sport-page-decor";
import { AppHeader } from "@/components/layout/app-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="page-canvas flex min-h-screen flex-col">
      <SportPageDecor />
      <AppHeader />
      <main className="relative z-[1] mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
