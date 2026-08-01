"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores";
import { useSupportChat } from "@/hooks/use-chats";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export function SupportButton() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const supportChatMutation = useSupportChat();

  const isMessagesPage = pathname === ROUTES.messages;

  const handleClick = async () => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      const chat = await supportChatMutation.mutateAsync();
      router.push(`${ROUTES.messages}?chatId=${chat.id}`);
    } catch {
      // Ошибка обработается в хуке
    }
  };

  const handleLogin = () => {
    setShowAuthModal(false);
    router.push(ROUTES.login);
  };

  if (isMessagesPage) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={supportChatMutation.isPending || !isInitialized}
        size='lg'
        className={cn(
          "fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-md",
          "bg-muted text-foreground hover:bg-muted/80 hover:text-foreground",
          "hover:scale-105 transition-transform duration-200",
          "md:bottom-8 md:right-8 md:h-14 md:w-14 md:bg-primary md:text-primary-foreground",
          "md:hover:bg-primary/90 mb-mobile-nav md:mb-0"
        )}
        aria-label='Техническая поддержка'
      >
        <LifeBuoy className='h-5 w-5 md:h-6 md:w-6' />
        {supportChatMutation.isPending && (
          <span className='absolute inset-0 flex items-center justify-center'>
            <span className='h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent' />
          </span>
        )}
      </Button>

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Войдите в аккаунт</DialogTitle>
            <DialogDescription>
              Чтобы написать в техническую поддержку, необходимо войти в аккаунт
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowAuthModal(false)}>
              Отмена
            </Button>
            <Button onClick={handleLogin}>Войти</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
