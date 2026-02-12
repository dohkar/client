"use client";

import { useMemo } from "react";
import {
  ArrowLeft,
  Archive,
  LifeBuoy,
  MoreVertical,
  ExternalLink,
  UserX,
  Flag,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPrice } from "@/lib/utils/format";
import { formatRelativeTime } from "@/lib/utils/chat-format";
import { useAuthStore } from "@/stores";
import { ROUTES } from "@/constants";
import type { Chat } from "@/types/chat";

interface ActionMenuButtonProps {
  isPropertyChat: boolean;
  propertyId?: string;
  onBlock?: () => void;
  onReport?: () => void;
}

function ActionMenuButton({
  isPropertyChat,
  propertyId,
  onBlock,
  onReport,
}: ActionMenuButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' aria-label='Действия в чате'>
          <MoreVertical className='h-5 w-5' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-48'>
        {isPropertyChat && propertyId && (
          <DropdownMenuItem asChild>
            <Link
              href={`/property/${propertyId}`}
              target='_blank'
              rel='noopener noreferrer'
            >
              <ExternalLink className='h-4 w-4' />
              Открыть объявление
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={ROUTES.help}>
            <LifeBuoy className='h-4 w-4' />
            Справка
          </Link>
        </DropdownMenuItem>
        {(onBlock || onReport) && <DropdownMenuSeparator />}
        {onBlock && (
          <DropdownMenuItem onClick={onBlock}>
            <UserX className='h-4 w-4' />
            Заблокировать
          </DropdownMenuItem>
        )}
        {onReport && (
          <DropdownMenuItem onClick={onReport} variant='destructive'>
            <Flag className='h-4 w-4' />
            Пожаловаться
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ChatHeaderProps {
  chat: Chat;
  onBack?: () => void;
  isOtherOnline?: boolean;
  isOtherTyping?: boolean;
  isRealtimeConnected?: boolean;
  isFallbackPolling?: boolean;
  isConnecting?: boolean;
  onBlock?: () => void;
  onReport?: () => void;
}

export function ChatHeader({
  chat,
  onBack,
  isOtherOnline,
  isOtherTyping,
  isRealtimeConnected,
  isFallbackPolling,
  isConnecting,
  onBlock,
  onReport,
}: ChatHeaderProps) {
  const isPropertyChat = chat.type === "PROPERTY";
  const isSupportChat = chat.type === "SUPPORT";
  const isArchived = chat.isArchived;

  const currentUserId = useAuthStore((s) => s.user?.id) || null;

  const otherParticipant = useMemo(() => {
    if (!currentUserId) return null;
    return chat.participants.find((p) => p.userId !== currentUserId) || null;
  }, [chat.participants, currentUserId]);

  const otherUser = otherParticipant?.user || null;
  const otherName = otherUser?.name || "Пользователь";

  const lastSeenText = useMemo(() => {
    if (!otherUser || !otherUser.lastSeenAt) return null;
    return `был ${formatRelativeTime(otherUser.lastSeenAt)}`;
  }, [otherUser, otherUser?.lastSeenAt]);

  // Connection error: только если реально нет соединения (чтобы показать красный бейдж внизу)
  const showConnectionProblem =
    !isRealtimeConnected &&
    !isOtherTyping &&
    (isFallbackPolling || isConnecting || isRealtimeConnected === false);

  return (
    <div className='border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10'>
      <div className='flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3'>
        {/* Левая часть: назад + аватар + имя/статус */}
        <div className='flex items-center gap-3 flex-1 min-w-0'>
          {onBack && (
            <Button
              variant='ghost'
              size='icon'
              onClick={onBack}
              className='lg:hidden -ml-2'
            >
              <ArrowLeft className='h-5 w-5' />
            </Button>
          )}

          {/* Аватар с индикатором онлайн-bottom-right */}
          <div className='relative shrink-0'>
            <Avatar className='h-10 w-10 border-2 border-background shadow-sm'>
              <AvatarImage src={otherUser?.avatar || undefined} alt={otherName} />
              <AvatarFallback>{(otherName[0] || "U").toUpperCase()}</AvatarFallback>
            </Avatar>
            {/* Статус онлайн — зелёная точка */}
            {isOtherOnline && (
              <span className='absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background' />
            )}
          </div>

          <div className='min-w-0'>
            <div className='flex items-center gap-2 min-w-0'>
              {/* Имя пользователя/техподдержки */}
              <h2 className='font-bold text-[1.09rem] truncate leading-snug'>
                {isSupportChat ? "Техническая поддержка Дохкар" : otherName}
              </h2>
              {/* Для PROPERTY показываем архив как маленькую плашку */}
              {isPropertyChat && isArchived && (
                <Badge
                  variant='secondary'
                  className='shrink-0 px-1 py-0 h-5 text-[0.80em]'
                >
                  <Archive className='h-3 w-3 mr-1' />
                  Удалено
                </Badge>
              )}
              {/* Support: tiny онлайн бейдж */}
              {isSupportChat && (
                <span className='relative flex h-3 w-3 ml-1'>
                  <span className='absolute inline-flex h-full w-full rounded-full bg-green-400 animate-ping opacity-70'></span>
                  <span className='relative inline-flex rounded-full h-3 w-3 bg-green-500'></span>
                </span>
              )}
            </div>
            {/* Статус в одну строку */}
            <div className='text-xs text-muted-foreground flex items-center gap-1.5 leading-tight'>
              {isSupportChat ? (
                // Для поддержки: статус всегда "онлайн" и маленький совет под именем только на desktop
                <>
                  <span className='text-green-500 font-medium'>онлайн</span>
                  <span className='hidden sm:inline text-[0.98em] ml-1 text-muted-foreground'>
                    Обычно отвечаем за 5–15 минут
                  </span>
                </>
              ) : isOtherTyping ? (
                <>
                  <span>печатает</span>
                  <span className='flex gap-0.5'>
                    <span className='h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]' />
                    <span className='h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]' />
                    <span className='h-1 w-1 rounded-full bg-muted-foreground animate-bounce' />
                  </span>
                </>
              ) : isOtherOnline ? (
                <span className='text-green-500 font-medium'>онлайн</span>
              ) : lastSeenText ? (
                <span className='text-muted-foreground'>{lastSeenText}</span>
              ) : (
                <span className='text-muted-foreground'>оффлайн</span>
              )}
            </div>
          </div>
        </div>
        {/* Правая часть: действия */}
        <div className='flex items-center gap-1 pl-2'>
          {/* Ссылка на объявление (у иконки external link) */}
          {isPropertyChat && chat.property && (
            <Button asChild variant='ghost' size='icon'>
              <Link
                href={`/property/${chat.property.id}`}
                target='_blank'
                tabIndex={-1}
                aria-label='Открыть объявление в новом окне'
              >
                <ExternalLink className='h-5 w-5' />
              </Link>
            </Button>
          )}
          {/* ⋮ меню */}
          <ActionMenuButton
            isPropertyChat={isPropertyChat}
            propertyId={chat.property?.id}
            onBlock={onBlock}
            onReport={onReport}
          />
        </div>
      </div>
      {/* Кликабельная панель объявления снизу (PROPERTY) */}
      {isPropertyChat && chat.property && (
        <Link
          href={`/property/${chat.property.id}`}
          target='_blank'
          className='flex items-center gap-2 px-3 sm:px-4 pb-2 sm:pb-3 pt-0.5 group transition hover:bg-muted/40 rounded'
        >
          {/* Картинка объявления (маленькая) */}
          {(() => {
            const imgSrc = chat.property.images?.[0] ?? "/placeholder.svg";
            return imgSrc ? (
              <div className='flex-shrink-0 h-8 w-8 overflow-hidden rounded object-cover border'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgSrc}
                  alt={chat.property.title}
                  className='h-full w-full object-cover'
                  draggable={false}
                />
              </div>
            ) : (
              <div className='flex-shrink-0 h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs'>
                <Archive className='h-4 w-4' />
              </div>
            );
          })()}
          <span className='truncate text-xs sm:text-sm text-muted-foreground group-hover:underline'>
            {chat.property.title} · {formatPrice(chat.property.price)}
          </span>
        </Link>
      )}

      {/* Для поддержки на мобильном: показать обычную подсказку ниже имени */}
      {isSupportChat && (
        <div className='sm:hidden px-3 pb-2 -mt-1 text-xs text-muted-foreground'>
          Обычно отвечаем за 5–15 минут
        </div>
      )}

      {/* Соединение: показывать только если реально offline (красный внизу) */}
      {showConnectionProblem && (
        <div className='flex border-t border-destructive/20 bg-destructive/5'>
          <div className='px-4 py-1 text-xs text-destructive font-semibold flex items-center gap-2 w-full'>
            Нет соединения
            {(isFallbackPolling || isConnecting) && (
              <span className='text-[0.89em] text-muted-foreground font-normal'>
                (авторежим)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
