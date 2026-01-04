// Хороший базовый eslint config для Next.js + TypeScript + Prettier, расширяемый и строгий.

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

/**
 * Хороший eslint конфиг для Next.js приложения на TypeScript:
 * - Использует строгие правила core-web-vitals Next.js (accessibility, best practices)
 * - Включает правила typescript для строгой типизации
 * - Интеграция с Prettier (Prettier всегда последним, чтобы отключить форматирование от ESLint в пользу Prettier)
 * - Явное указание игнорируемых директорий (build-артефакты, автогенерируемые файлы)
 * - В будущем легко добавлять свои overrides
 */

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // игнорируем кастомные генераторы (если есть)
    "dist/**",
    "coverage/**",
  ]),
  // Можно добавить свои overrides для компонентов, страниц, стилей и т.д.
  {
    files: ["src/components/**/*.tsx", "app/**/*.tsx"],
    rules: {
      // Например, более строгие правила для компонентов:
      "react/prop-types": "off",
      "react/no-unused-prop-types": "warn",
    },
  },
  {
    files: ["*.ts", "*.tsx"],
    rules: {
      // Можно усилить типобезопасность:
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["**/*.{js,ts,tsx}"],
    rules: {
      // Общие best practices:
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-unused-vars": "off", // отключаем в пользу ts
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
