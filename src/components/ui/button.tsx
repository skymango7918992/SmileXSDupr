import { cva, type VariantProps } from "class-variance-authority";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[8px] text-sm font-medium transition-[background,box-shadow,transform,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:pointer-events-none disabled:opacity-50 max-md:min-h-12 max-md:text-base",
  {
    variants: {
      variant: {
        default: "glass-btn-primary",
        secondary: "glass-btn-secondary text-foreground hover:text-foreground",
        ghost:
          "text-secondary-foreground hover:bg-surface-muted hover:text-foreground",
        danger:
          "bg-live/10 text-live hover:bg-live/15 border border-live/20",
        outline:
          "border border-border bg-surface text-foreground hover:bg-surface-muted",
        accent: "ds-btn-accent",
      },
      size: {
        default: "h-10 px-4 max-md:h-12 max-md:px-5",
        sm: "h-8 px-3 text-xs max-md:h-10 max-md:text-sm",
        lg: "h-11 px-5 max-md:h-12 max-md:px-6",
        icon: "h-9 w-9 max-md:h-12 max-md:w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4 shrink-0" />}
      {children}
    </button>
  );
}
