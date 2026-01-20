"use client";

import {
  Check,
  Info,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      offset={20}
      gap={12}
      visibleToasts={5}
      duration={4000}
      closeButton
      icons={{
        success: (
          <div className="toast-icon-wrapper toast-icon-success">
            <Check className="h-4 w-4" strokeWidth={3} />
          </div>
        ),
        info: (
          <div className="toast-icon-wrapper toast-icon-info">
            <Info className="h-4 w-4" strokeWidth={2.5} />
          </div>
        ),
        warning: (
          <div className="toast-icon-wrapper toast-icon-warning">
            <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
          </div>
        ),
        error: (
          <div className="toast-icon-wrapper toast-icon-error">
            <X className="h-4 w-4" strokeWidth={3} />
          </div>
        ),
        loading: (
          <div className="toast-icon-wrapper toast-icon-loading">
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
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
