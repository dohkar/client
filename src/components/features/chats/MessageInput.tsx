"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { hasProhibitedContent } from "@/lib/utils/content-filter";
import { toast } from "sonner";

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  messageCount?: number;
}

export function MessageInput({
  onSend,
  disabled = false,
  messageCount = 0,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
      onSend(trimmedText);
      setText("");
      setIsSending(false);
    }, 500);
  }, [text, messageCount, isSending, onSend]);

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
    };
  }, []);

  return (
    <div className="border-t bg-background p-4">
      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение..."
          disabled={disabled || isSending}
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
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
