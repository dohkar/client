"use client";

import * as React from "react";
import {
  THEME_COOKIE_NAME,
  THEME_COOKIE_MAX_AGE,
  type ThemeValue,
} from "@/constants/theme";

interface ThemeContextValue {
  theme: ThemeValue;
  setTheme: (theme: ThemeValue) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function readThemeFromCookie(): ThemeValue {
  if (typeof document === "undefined") return "light";
  const match = document.cookie.match(
    new RegExp(`(^| )${THEME_COOKIE_NAME}=([^;]+)`)
  );
  const value = match?.[2];
  return value === "dark" ? "dark" : "light";
}

function writeThemeCookie(value: ThemeValue): void {
  document.cookie = `${THEME_COOKIE_NAME}=${value};path=/;max-age=${THEME_COOKIE_MAX_AGE};SameSite=Lax`;
}

function applyThemeToDocument(value: ThemeValue): void {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(value);
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeValue;
}

/**
 * Binary theme provider (light | dark). Cookie — единственный источник истины.
 * Тема применяется на <html> через className.
 * FOUC предотвращается: layout добавляет класс на html из cookie; ThemeInitScript
 * (beforeInteractive) дублирует это до гидрации при hard reload.
 */
export function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<ThemeValue>(defaultTheme);

  React.useEffect(() => {
    const fromCookie = readThemeFromCookie();
    setThemeState(fromCookie);
    applyThemeToDocument(fromCookie);
  }, []);

  const setTheme = React.useCallback((value: ThemeValue) => {
    setThemeState(value);
    applyThemeToDocument(value);
    writeThemeCookie(value);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
