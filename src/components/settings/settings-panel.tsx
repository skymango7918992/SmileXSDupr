import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  columns?: 1 | 2;
};

export function SettingsPanel({ children, columns = 1 }: Props) {
  return (
    <div
      className={
        columns === 2
          ? "grid gap-4 xl:grid-cols-2 xl:items-start"
          : "space-y-4"
      }
    >
      {children}
    </div>
  );
}
