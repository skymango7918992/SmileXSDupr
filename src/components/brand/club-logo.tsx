import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function ClubLogo({ size = 40, className, priority }: Props) {
  return (
    <Image
      src="/images/xs-club-logo.png"
      alt="星鑽 XS 匹克球"
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-full object-cover shadow-sm", className)}
    />
  );
}
