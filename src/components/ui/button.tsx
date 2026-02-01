import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-ring active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary to-primary/90 text-primary-foreground shadow-md hover:shadow-lg hover:brightness-105 active:brightness-95",
        destructive:
          "bg-gradient-to-b from-destructive to-destructive/90 text-destructive-foreground shadow-md hover:shadow-lg hover:brightness-105 active:brightness-95",
        outline:
          "border border-input bg-background/70 backdrop-blur-sm hover:bg-accent/80 hover:border-accent-foreground/30 text-foreground shadow-sm hover:shadow active:bg-accent/60",
        secondary:
          "bg-secondary/90 text-secondary-foreground shadow-sm hover:bg-secondary hover:shadow-md active:bg-secondary/80",
        ghost: "hover:bg-accent/60 hover:text-accent-foreground active:bg-accent/40",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 active:text-primary/70 p-0 h-auto",
        fancy:
          "gradient-mountains text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
        clear:
          "bg-transparent text-foreground shadow-none hover:bg-transparent hover:text-foreground active:bg-transparent active:text-foreground p-0",
      },
      size: {
        default: "h-11 px-6 py-2 min-h-[44px] has-[>svg]:px-4",
        sm: "h-9 rounded-lg px-4 min-h-[38px] has-[>svg]:px-3 gap-1.5",
        lg: "h-12 rounded-xl px-8 text-base min-h-[52px] has-[>svg]:px-5",
        icon: "size-11 rounded-xl min-w-[44px] min-h-[44px]",
        "icon-sm": "size-9 rounded-lg min-w-[38px] min-h-[38px]",
        "icon-lg": "size-12 rounded-xl min-w-[52px] min-h-[52px]",
        "icon-xl": "size-14 rounded-xl min-w-[56px] min-h-[56px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
