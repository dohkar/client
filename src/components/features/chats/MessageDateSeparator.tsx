"use client";

import { formatDateGroup } from "@/lib/utils/chat-format";

interface MessageDateSeparatorProps {
  date: Date | string;
}

export function MessageDateSeparator({ date }: MessageDateSeparatorProps) {
  const formattedDate = formatDateGroup(date);

  return (
    <div className="flex items-center justify-center my-4">
      <div className="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground font-medium">
        {formattedDate}
      </div>
    </div>
  );
}
