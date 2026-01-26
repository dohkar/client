"use client";

import { MessageSquare, MessagesSquare } from "lucide-react";

interface EmptyStateProps {
  type: "no-chats" | "no-messages" | "select-chat" | "support-empty";
  chatType?: "PROPERTY" | "SUPPORT";
}

export function EmptyState({ type, chatType }: EmptyStateProps) {
  const content = {
    "no-chats": {
      icon: MessagesSquare,
      title: "Нет чатов",
      description: "У вас пока нет активных чатов",
    },
    "no-messages": {
      icon: MessageSquare,
      title: "Нет сообщений",
      description:
        chatType === "SUPPORT"
          ? "Опишите проблему максимально подробно — это ускорит ответ"
          : "Будьте первым, кто напишет сообщение",
    },
    "select-chat": {
      icon: MessageSquare,
      title: "Выберите чат",
      description: "Выберите чат из списка, чтобы начать общение",
    },
    "support-empty": {
      icon: MessageSquare,
      title: "Начните диалог",
      description:
        "Опишите проблему максимально подробно — это ускорит ответ. Мы получим ваше сообщение и ответим в ближайшее время.",
    },
  };

  const { icon: Icon, title, description } = content[type];

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}
