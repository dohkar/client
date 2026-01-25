#!/usr/bin/env node

/**
 * Скрипт для синхронизации API контракта с бэкендом
 *
 * Выполняет полный цикл:
 * 1. Загружает OpenAPI спецификацию с сервера
 * 2. Валидирует спецификацию
 * 3. Генерирует TypeScript типы напрямую с сервера (без сохранения файла)
 * 4. Проверяет типы на ошибки
 *
 * Использование:
 *   node scripts/sync-api.js [--url <api-url>] [--skip-check] [--save-file]
 *
 * Опции:
 *   --url <api-url>     URL API сервера (по умолчанию из NEXT_PUBLIC_API_URL или http://localhost:4000)
 *   --skip-check        Пропустить проверку типов (tscheck)
 *   --save-file         Сохранить openapi.json в корень проекта (опционально)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Цвета для консоли
const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
	magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
	log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
	log(`✓ ${message}`, 'green');
}

function logError(message) {
	log(`❌ ${message}`, 'red');
}

function logWarning(message) {
	log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
	log(`ℹ️  ${message}`, 'blue');
}

function getApiUrl() {
	const args = process.argv.slice(2);
	const urlIndex = args.indexOf('--url');
	if (urlIndex !== -1 && args[urlIndex + 1]) {
		return args[urlIndex + 1];
	}

	const envUrl = process.env.NEXT_PUBLIC_API_URL;
	if (envUrl) {
		return envUrl.replace(/\/api\/?$/, '');
	}

	return 'http://localhost:4000';
}

function shouldSkipCheck() {
	return process.argv.includes('--skip-check');
}

function shouldSaveFile() {
	return process.argv.includes('--save-file');
}

function fetchOpenApi(url) {
	return new Promise((resolve, reject) => {
		const openApiUrl = `${url}/openapi.json`;
		log(`📥 Загрузка OpenAPI спецификации с ${openApiUrl}...`, 'blue');

		const client = url.startsWith('https') ? https : http;

		const request = client.get(openApiUrl, (response) => {
			if (response.statusCode !== 200) {
				reject(
					new Error(`Ошибка загрузки: HTTP ${response.statusCode} - ${response.statusMessage}`)
				);
				return;
			}

			let data = '';
			response.on('data', (chunk) => {
				data += chunk;
			});

			response.on('end', () => {
				try {
					const json = JSON.parse(data);
					resolve(json);
				} catch (error) {
					reject(new Error(`Ошибка парсинга JSON: ${error.message}`));
				}
			});
		});

		request.on('error', (error) => {
			reject(
				new Error(
					`Ошибка сети: ${error.message}\nУбедитесь, что сервер запущен: cd ../server && npm run start:dev`
				)
			);
		});

		request.setTimeout(10000, () => {
			request.destroy();
			reject(new Error('Таймаут запроса (10 секунд)'));
		});
	});
}

function validateOpenAPI(json) {
	const errors = [];
	const warnings = [];

	// Базовая валидация
	if (!json.openapi && !json.swagger) {
		errors.push('Отсутствует поле openapi или swagger');
	}

	if (!json.info) {
		errors.push('Отсутствует секция info');
	}

	if (!json.paths) {
		errors.push('Отсутствует секция paths');
	}

	if (json.openapi && !json.openapi.startsWith('3.')) {
		errors.push(`Неподдерживаемая версия OpenAPI: ${json.openapi}. Требуется 3.x`);
	}

	return { errors, warnings, valid: errors.length === 0 };
}

function generateTypesFromUrl(openApiUrl, outputPath) {
	try {
		// Используем openapi-typescript напрямую с URL
		execSync(`npx openapi-typescript "${openApiUrl}" -o "${outputPath}"`, {
			stdio: 'inherit',
			encoding: 'utf8',
			cwd: path.resolve(__dirname, '..'),
		});
		return true;
	} catch (error) {
		return false;
	}
}

function generateTypesFromJson(json, outputPath) {
	try {
		// Создаем временный файл
		const tempFile = path.join(__dirname, '..', '.openapi.temp.json');
		fs.writeFileSync(tempFile, JSON.stringify(json, null, 2), 'utf8');

		try {
			execSync(`npx openapi-typescript "${tempFile}" -o "${outputPath}"`, {
				stdio: 'inherit',
				encoding: 'utf8',
				cwd: path.resolve(__dirname, '..'),
			});
			return true;
		} finally {
			// Удаляем временный файл
			if (fs.existsSync(tempFile)) {
				fs.unlinkSync(tempFile);
			}
		}
	} catch (error) {
		return false;
	}
}

function runCommand(command, cwd) {
	try {
		execSync(command, {
			cwd,
			stdio: 'inherit',
			encoding: 'utf8',
		});
		return true;
	} catch (error) {
		return false;
	}
}

async function main() {
	const projectRoot = path.resolve(__dirname, '..');
	const typesPath = path.join(projectRoot, 'src', 'types', 'api.ts');
	const openApiPath = path.join(projectRoot, '..', 'openapi.json'); // Опционально, если --save-file

	log('\n🔄 Синхронизация API контракта с бэкендом\n', 'magenta');
	log('═══════════════════════════════════════════', 'cyan');

	try {
		// Шаг 1: Загрузка OpenAPI спецификации
		logStep('1', 'Загрузка OpenAPI спецификации с сервера');
		const apiUrl = getApiUrl();
		logInfo(`API URL: ${apiUrl}`);

		const openApiJson = await fetchOpenApi(apiUrl);
		logSuccess('OpenAPI спецификация загружена');

		// Опционально: сохранить файл
		if (shouldSaveFile()) {
			const jsonString = JSON.stringify(openApiJson, null, 2);
			fs.writeFileSync(openApiPath, jsonString, 'utf8');
			logInfo(`Файл сохранен: ${openApiPath}`);
		}

		// Шаг 2: Валидация OpenAPI
		logStep('2', 'Валидация OpenAPI спецификации');
		const validation = validateOpenAPI(openApiJson);

		if (!validation.valid) {
			logError('Валидация не пройдена!');
			validation.errors.forEach((error) => {
				logError(`   - ${error}`);
			});
			logWarning('Исправьте ошибки в OpenAPI спецификации');
			process.exit(1);
		}

		if (validation.warnings.length > 0) {
			validation.warnings.forEach((warning) => {
				logWarning(`   - ${warning}`);
			});
		}

		logSuccess('OpenAPI спецификация валидна');
		logInfo(`   Версия: ${openApiJson.openapi || openApiJson.swagger}`);
		logInfo(`   Путей: ${Object.keys(openApiJson.paths || {}).length}`);
		logInfo(`   Схем: ${Object.keys(openApiJson.components?.schemas || {}).length}`);

		// Шаг 3: Генерация типов
		logStep('3', 'Генерация TypeScript типов');
		logInfo('Запуск: openapi-typescript');

		const openApiUrl = `${apiUrl}/openapi.json`;
		const generateSuccess = generateTypesFromUrl(openApiUrl, typesPath);

		if (!generateSuccess) {
			logError('Ошибка генерации типов');
			logWarning('Попытка генерации из загруженного JSON...');

			const generateFromJsonSuccess = generateTypesFromJson(openApiJson, typesPath);
			if (!generateFromJsonSuccess) {
				logError('Не удалось сгенерировать типы');
				process.exit(1);
			}
		}

		logSuccess('TypeScript типы сгенерированы');

		// Шаг 4: Проверка типов
		if (!shouldSkipCheck()) {
			logStep('4', 'Проверка типов (tscheck)');
			logInfo('Запуск: tsc --noEmit');

			const checkSuccess = runCommand('npm run tscheck', projectRoot);

			if (!checkSuccess) {
				logError('Обнаружены ошибки типов!');
				logWarning('\n💡 Действия:');
				logWarning('   1. Исправьте ошибки типов в коде');
				logWarning('   2. Проверьте изменения в API контракте');
				logWarning('   3. Повторите синхронизацию: npm run sync:api');
				logWarning('\n   Или пропустите проверку: npm run sync:api -- --skip-check');
				process.exit(1);
			}

			logSuccess('Типы проверены, ошибок не обнаружено');
		} else {
			logWarning('Проверка типов пропущена (--skip-check)');
		}

		// Итог
		log('\n═══════════════════════════════════════════', 'cyan');
		logSuccess('Синхронизация API завершена успешно!');
		logInfo('\n📝 Следующие шаги:');
		logInfo('   git add src/types/api.ts');
		logInfo('   git commit -m "Update API types"');

		process.exit(0);
	} catch (error) {
		log('\n═══════════════════════════════════════════', 'cyan');
		logError(`Ошибка: ${error.message}`);

		if (error.message.includes('Ошибка сети') || error.message.includes('Таймаут')) {
			logWarning('\n💡 Убедитесь, что:');
			logWarning('   1. Бэкенд сервер запущен: cd ../server && npm run start:dev');
			logWarning('   2. Сервер доступен по адресу: ' + getApiUrl());
			logWarning('   3. Эндпоинт /openapi.json доступен');
		}

		process.exit(1);
	}
}

main();
