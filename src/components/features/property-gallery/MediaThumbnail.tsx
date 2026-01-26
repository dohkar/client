import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { MediaItem } from "./types";
import { getMediaUrl, getMediaAlt, isVideo } from "./utils";

type MediaThumbnailProps = {
  item: MediaItem;
  index: number;
  onClick: () => void;
  size?: "hero" | "thumb";
  className?: string;
  showOverlay?: boolean;
  overlayText?: string;
};

const PLAY_BUTTON_SIZES = {
  hero: { container: "w-16 h-16", icon: "w-8 h-8" },
  thumb: { container: "w-8 h-8", icon: "w-4 h-4" },
} as const;

export function MediaThumbnail({
  item,
  index,
  onClick,
  size = "thumb",
  className,
  showOverlay = false,
  overlayText,
}: MediaThumbnailProps) {
  const isVideoItem = isVideo(item);
  const playButtonSize = PLAY_BUTTON_SIZES[size];

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative bg-muted overflow-hidden group",
        size === "hero" ? "rounded-xl" : "rounded-lg",
        !isVideoItem && "cursor-zoom-in",
        className
      )}
      aria-label={getMediaAlt(item, index)}
    >
      {isVideoItem ? (
        <>
          <Image
            src={getMediaUrl(item, true)}
            alt={getMediaAlt(item, index)}
            fill
            className="object-cover"
            priority={size === "hero"}
            loading={size === "hero" ? "eager" : "lazy"}
            sizes={
              size === "hero"
                ? "(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 50vw"
                : "(max-width: 768px) 25vw, 10vw"
            }
            fetchPriority={size === "hero" ? "high" : "low"}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div
              className={cn(
                "rounded-full bg-white/90 flex items-center justify-center shadow-lg",
                playButtonSize.container
              )}
            >
              <Play
                className={cn("text-primary ml-1", playButtonSize.icon)}
                fill="currentColor"
              />
            </div>
          </div>
        </>
      ) : (
        <Image
          src={getMediaUrl(item, true)}
          alt={getMediaAlt(item, index)}
          fill
          className={cn(
            "object-cover",
            size === "hero" && "transition-transform group-hover:scale-[1.02]"
          )}
          priority={size === "hero"}
          loading={size === "hero" ? "eager" : "lazy"}
          sizes={
            size === "hero"
              ? "(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 50vw"
              : "(max-width: 768px) 25vw, 10vw"
          }
          fetchPriority={size === "hero" ? "high" : "low"}
        />
      )}

      {/* Overlay для "+N фото" */}
      {showOverlay && overlayText && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-white text-sm font-semibold">{overlayText}</span>
        </div>
      )}
    </button>
  );
}
