"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Send, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { hasProhibitedContent } from "@/lib/utils/content-filter";
import { toast } from "sonner";
import { socketClient } from "@/lib/socket/socket-client";
import { useSocket } from "@/hooks/use-socket";

const MIN_ROWS = 1;
const MAX_HEIGHT_PX = 200;

interface MessageInputProps {
  onSend: (text: string) => void;
  chatId?: string | null;
  disabled?: boolean;
  messageCount?: number;
  chatType?: "PROPERTY" | "SUPPORT";
  showSpamHint?: boolean;
}

export function MessageInput({
  onSend,
  chatId,
  disabled = false,
  messageCount = 0,
  chatType,
  showSpamHint = false,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isConnected } = useSocket();
  const typingIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const lastTypingStartSentAt = useRef<number>(0);
  const TYPING_THROTTLE_MS = 450;

  /** Авто-рост высоты textarea по контенту */
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.min(Math.max(el.scrollHeight, 44), MAX_HEIGHT_PX);
    el.style.height = `${newHeight}px`;
  }, []);

  /**
   * Обработчик отправки с debounce (500ms)
   */
  const handleSend = useCallback(() => {
    const trimmedText = text.trim();

    if (!trimmedText) return;

    // Проверка на запрещенный контент в первых 2 сообщениях
    if (messageCount < 2 && hasProhibitedContent(trimmedText)) {
      toast.error(
        "В первых двух сообщениях запрещено отправлять номера телефонов и ссылки"
      );
      return;
    }

    if (isSending) return;

    setIsSending(true);

    // Debounce 500ms
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      // typing: stop on send
      if (chatId && isConnected) {
        socketClient.sendTyping(chatId, false);
      }
      onSend(trimmedText);
      setText("");
      setIsSending(false);
      setTimeout(adjustHeight, 0); // сброс высоты после отправки
    }, 500);
  }, [text, messageCount, isSending, onSend, adjustHeight, chatId, isConnected]);

  /**
   * Обработчик Enter (отправка), Shift+Enter (новая строка)
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Очистка timeout при unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (typingIdleTimeoutRef.current) {
        clearTimeout(typingIdleTimeoutRef.current);
      }
      if (chatId && isConnected) {
        socketClient.sendTyping(chatId, false);
      }
    };
  }, [chatId, isConnected]);

  // Авто-рост при изменении текста
  useEffect(() => {
    adjustHeight();
  }, [text, adjustHeight]);

  // Typing indicator: throttle typing:start (1 раз в 400–500ms), typing:stop по idle
  useEffect(() => {
    if (!chatId || !isConnected) return;
    if (!text.trim()) {
      socketClient.sendTyping(chatId, false);
      return;
    }

    const now = Date.now();
    if (now - lastTypingStartSentAt.current >= TYPING_THROTTLE_MS) {
      lastTypingStartSentAt.current = now;
      socketClient.sendTyping(chatId, true);
    }

    if (typingIdleTimeoutRef.current) {
      clearTimeout(typingIdleTimeoutRef.current);
    }
    typingIdleTimeoutRef.current = setTimeout(() => {
      socketClient.sendTyping(chatId, false);
    }, 1200);
  }, [text, chatId, isConnected]);

  return (
    <div className="border-t bg-background p-4">
      {/* Hint при спаме в support-чате */}
      {showSpamHint && chatType === "SUPPORT" && (
        <Alert className="mb-3 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
            Мы получили ваше сообщение, пожалуйста, дождитесь ответа. Обычно отвечаем в течение 15 минут.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение..."
          disabled={disabled || isSending}
          className="min-h-[44px] max-h-[200px] resize-none overflow-y-auto py-3"
          rows={MIN_ROWS}
          onBlur={() => {
            if (chatId && isConnected) {
              socketClient.sendTyping(chatId, false);
            }
          }}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || isSending || !text.trim()}
          size="icon"
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Enter — отправить, Shift+Enter — новая строка
      </p>
    </div>
  );
}
