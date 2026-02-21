import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "h-11 w-full rounded-full border border-input bg-background px-4 py-2.5 text-base placeholder:text-muted-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);

Input.displayName = "Input";

export { Input };
