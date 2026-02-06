import Script from "next/script";
import { THEME_COOKIE_NAME } from "@/constants/theme";

/**
 * Блокирующий скрипт (beforeInteractive) — выполняется до гидрации React.
 * Читает cookie theme, применяет класс к <html>. Вместе с server-set className
 * на html гарантирует отсутствие white flash при hard reload.
 *
 * Fallback "light" — без cookie страница рендерится светлой до первого paint.
 */
export function ThemeInitScript() {
  const scriptContent = `
(function() {
  var match = document.cookie.match(new RegExp('(^| )' + '${THEME_COOKIE_NAME}' + '=([^;]+)'));
  var theme = (match && match[2]) === 'dark' ? 'dark' : 'light';
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
})();
`;

  return (
    <Script
      id="theme-init"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  );
}
