"use client";

import { ArrowLeft, Archive, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/format";
import type { Chat } from "@/types/chat";

interface ChatHeaderProps {
  chat: Chat;
  onBack?: () => void;
}

export function ChatHeader({ chat, onBack }: ChatHeaderProps) {
  const isPropertyChat = chat.type === "PROPERTY";
  const isSupportChat = chat.type === "SUPPORT";
  const isArchived = chat.isArchived;

  return (
    <div className="border-b bg-background p-4">
      <div className="flex items-center gap-3">
        {/* Кнопка назад (mobile) */}
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Информация о чате */}
        <div className="flex-1 min-w-0">
          {isPropertyChat && chat.property ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base truncate">
                  {chat.property.title}
                </h2>
                {isArchived && (
                  <Badge variant="secondary" className="shrink-0">
                    <Archive className="h-3 w-3 mr-1" />
                    Объявление удалено
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatPrice(chat.property.price)}
              </p>
            </div>
          ) : isSupportChat ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-primary shrink-0" />
                <h2 className="font-semibold text-base">
                  Техническая поддержка Dohkar
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Мы отвечаем как можно быстрее
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <h2 className="font-semibold text-base">Поддержка</h2>
              <p className="text-sm text-muted-foreground">
                Мы ответим в ближайшее время
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
