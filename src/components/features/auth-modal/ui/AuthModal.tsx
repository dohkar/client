"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAuthModalStore } from "../model/auth-modal.store";
import { AuthModalContent } from "./AuthModalContent";

/**
 * Модальное окно авторизации (desktop: центрированная модалка, mobile: bottom sheet)
 */
export function AuthModal() {
  const { isOpen, close, resetIfNeeded } = useAuthModalStore();

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        resetIfNeeded();
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen, resetIfNeeded]);

  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      const bodyTop = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (bodyTop) {
        window.scrollTo(0, parseInt(bodyTop || "0", 10) * -1);
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className={cn(
          "gap-0 py-8 px-4 sm:max-w-[440px]",
          "max-sm:!fixed max-sm:!bottom-0 max-sm:!left-0 max-sm:!right-0",
          "max-sm:!top-auto max-sm:!w-full max-sm:!max-w-full",
          "max-sm:!translate-x-0 max-sm:!translate-y-0",
          "max-sm:!rounded-t-2xl max-sm:!rounded-b-none",
          "max-sm:data-[state=open]:slide-in-from-bottom",
          "max-sm:data-[state=closed]:slide-out-to-bottom"
        )}
        showCloseButton={false}
      >
        <DialogTitle className='sr-only'>Авторизация</DialogTitle>
        <DialogDescription className='sr-only'>
          Войдите в систему по номеру телефона (SMS-код)
        </DialogDescription>

        <button
          type='button'
          onClick={handleClose}
          className='absolute right-1 top-1 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors'
          aria-label='Закрыть'
        >
          <X className='h-6 w-6 text-muted-foreground hover:text-foreground' />
        </button>

        <AuthModalContent />
      </DialogContent>
    </Dialog>
  );
}
