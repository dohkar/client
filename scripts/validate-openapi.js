#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- Node CLI script */

/**
 * Валидация OpenAPI спецификации
 *
 * Может работать с URL сервера или локальным файлом
 *
 * Использование:
 *   node scripts/validate-openapi.js [url-or-path]
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// Импортируем функцию валидации из оригинального скрипта
// Для упрощения используем упрощенную версию

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function fetchFromUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const request = client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on("error", reject);
    request.setTimeout(5000, () => {
      request.destroy();
      reject(new Error("Timeout"));
    });
  });
}

function validateBasicStructure(json) {
  const errors = [];
  if (!json.openapi && !json.swagger) {
    errors.push("Отсутствует поле openapi или swagger");
  }
  if (!json.info) {
    errors.push("Отсутствует секция info");
  }
  if (!json.paths) {
    errors.push("Отсутствует секция paths");
  }
  if (json.openapi && !json.openapi.startsWith("3.")) {
    errors.push(`Неподдерживаемая версия OpenAPI: ${json.openapi}`);
  }
  return errors;
}

async function main() {
  const input = process.argv[2] || "http://localhost:4000/openapi.json";

  log("\n🔍 Валидация OpenAPI спецификации\n", "blue");
  log("═══════════════════════════════════════════", "blue");

  try {
    let json;

    if (input.startsWith("http://") || input.startsWith("https://")) {
      log(`📥 Загрузка с ${input}...`, "blue");
      json = await fetchFromUrl(input);
    } else {
      log(`📄 Чтение файла ${input}...`, "blue");
      const content = fs.readFileSync(input, "utf8");
      json = JSON.parse(content);
    }

    const errors = validateBasicStructure(json);

    if (errors.length > 0) {
      log("\n❌ Ошибки:", "red");
      errors.forEach((error) => {
        log(`   - ${error}`, "red");
      });
      process.exit(1);
    }

    log("\n✅ Валидация пройдена!", "green");
    log(`   Версия: ${json.openapi || json.swagger}`, "blue");
    log(`   Путей: ${Object.keys(json.paths || {}).length}`, "blue");
    log(`   Схем: ${Object.keys(json.components?.schemas || {}).length}`, "blue");
    process.exit(0);
  } catch (error) {
    log(`\n❌ Ошибка: ${error.message}`, "red");
    process.exit(1);
  }
}

main();
