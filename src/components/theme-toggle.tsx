"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  /** Компактная кнопка для хедера */
  variant?: "icon" | "embed";
  className?: string;
}

/**
 * Переключатель светлая ↔ тёмная тема.
 *
 * Mounted guard: до гидрации рендерим один и тот же placeholder (Sun opacity-0),
 * чтобы сервер и клиент совпадали 1:1. После mount показываем реальную иконку.
 * Исключает hydration mismatch из-за темы.
 */
export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";
  const Icon = isDark ? Moon : Sun;

  // До mount — один и тот же JSX на сервере и клиенте (Sun placeholder).
  // Предотвращает hydration mismatch при разных темах.
  if (!mounted) {
    return (
      <Button
        variant='ghost'
        size='icon-sm'
        className={cn("shrink-0", className)}
        aria-label='Переключить тему'
      >
        <Sun className='h-5 w-5 opacity-0' aria-hidden />
      </Button>
    );
  }

  if (variant === "embed") {
    return (
      <button
        type='button'
        onClick={toggleTheme}
        className={cn(
          "flex w-full items-center gap-2.5 px-2.5 py-2 text-sm rounded-full transition-colors cursor-pointer",
          "hover:bg-accent/70",
          className
        )}
        aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      >
        <Icon
          className='h-4 w-4 shrink-0 transition-transform duration-200 ease-out'
          aria-hidden
        />
        {isDark ? "Тёмная тема" : "Светлая тема"}
      </button>
    );
  }

  return (
    <Button
      variant='ghost'
      size='icon-sm'
      className={cn("shrink-0", className)}
      onClick={toggleTheme}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
    >
      <Icon className='h-5 w-5 transition-transform duration-200 ease-out' aria-hidden />
    </Button>
  );
}
