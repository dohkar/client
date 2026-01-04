"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

function Empty({
  className,
  icon,
  title = "Ничего не найдено",
  description,
  action,
  ...props
}: EmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground [&>svg]:size-12 sm:[&>svg]:size-16 opacity-60">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="mb-2 text-lg sm:text-xl font-semibold text-foreground">
          {title}
        </h3>
      )}
      {description && (
        <p className="mb-6 max-w-sm text-sm sm:text-base text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

export { Empty };
