"use client";

import {
  Check,
  Info,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      className="toaster group"
      theme={resolvedTheme as "light" | "dark" | "system"}
      position="bottom-right"
      offset={20}
      gap={12}
      visibleToasts={5}
      duration={4000}
      closeButton
      richColors={false}
      expand={false}
      icons={{
        success: (
          <div className="toast-icon-wrapper toast-icon-success" aria-hidden="true">
            <Check strokeWidth={2.5} />
          </div>
        ),
        info: (
          <div className="toast-icon-wrapper toast-icon-info" aria-hidden="true">
            <Info strokeWidth={2} />
          </div>
        ),
        warning: (
          <div className="toast-icon-wrapper toast-icon-warning" aria-hidden="true">
            <AlertTriangle strokeWidth={2} />
          </div>
        ),
        error: (
          <div className="toast-icon-wrapper toast-icon-error" aria-hidden="true">
            <X strokeWidth={2.5} />
          </div>
        ),
        loading: (
          <div className="toast-icon-wrapper toast-icon-loading" aria-hidden="true">
            <Loader2 className="animate-spin" strokeWidth={2} />
          </div>
        ),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "toast-base",
          title: "toast-title",
          description: "toast-description",
          actionButton: "toast-action-btn",
          cancelButton: "toast-cancel-btn",
          closeButton: "toast-close-btn",
          success: "toast-success",
          error: "toast-error",
          warning: "toast-warning",
          info: "toast-info",
          loading: "toast-loading",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };