import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-sky-500 text-slate-950 hover:bg-sky-400 focus-visible:ring-sky-400",
        secondary:
          "bg-[var(--card-elevated)] text-[var(--foreground)] hover:bg-[var(--card-highlight)] focus-visible:ring-[var(--border)]",
        outline:
          "border border-[var(--border)] bg-transparent hover:bg-[var(--card-elevated)] focus-visible:ring-sky-400/50",
        ghost: "hover:bg-[var(--card-elevated)] focus-visible:ring-sky-400/50",
        destructive: "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500",
        link: "text-sky-400 underline-offset-4 hover:underline",
        accent: "bg-amber-500 text-slate-950 hover:bg-amber-400 focus-visible:ring-amber-400",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6",
        icon: "h-10 w-10",
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
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }));
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(classes, (children as React.ReactElement<{ className?: string }>).props.className),
      });
    }
    return (
      <button className={classes} ref={ref} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
