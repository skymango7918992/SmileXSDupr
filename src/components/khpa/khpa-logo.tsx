import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function KhpaLogo({ size = 44, className, priority }: Props) {
  return (
    <Image
      src="/khpa-logo.png"
      alt="高雄市匹克球協會 KHPA"
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-full object-cover shadow-sm ring-2 ring-amber-400/40", className)}
    />
  );
}
