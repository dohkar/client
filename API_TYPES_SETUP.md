# ✅ Настройка автоматической генерации типов из OpenAPI

## Что было сделано

### 1. ✅ Установлен инструмент генерации типов
- Установлен `openapi-typescript` как dev dependency
- Настроен скрипт `generate:api-types` в `package.json`

### 2. ✅ Сгенерированы типы из OpenAPI
- Типы автоматически генерируются напрямую с сервера
- Результат сохраняется в `src/types/api.ts` (автогенерируемый файл)
- Не требуется локальный файл openapi.json

### 3. ✅ Созданы утилиты для работы с типами
- Файл `src/lib/api-types.ts` содержит:
  - Утилиты для извлечения типов запросов (`RequestBody`)
  - Утилиты для извлечения типов ответов (`ResponseData`)
  - Утилиты для извлечения параметров (`RequestParams`, `OperationParams`)
  - Утилиты для работы с операциями (`OperationResponse`, `OperationRequestBody`)
  - Готовые типы для всех эндпоинтов API

### 4. ✅ Созданы примеры типизированных сервисов
- `src/services/auth-typed.service.ts` - пример сервиса для авторизации
- `src/services/property-typed.service.ts` - пример сервиса для недвижимости
- Все методы строго типизированы без использования `any`

### 5. ✅ Настроена автоматическая генерация
- Типы автоматически генерируются перед сборкой (`npm run build`)
- Можно запустить вручную: `npm run generate:api-types`

## Структура файлов

```
client/
├── src/
│   ├── types/
│   │   ├── api.ts              # ⚠️ Автогенерируемый (не редактировать!)
│   │   └── index.ts             # Экспорт типов
│   ├── lib/
│   │   └── api-types.ts         # Утилиты для работы с типами
│   └── services/
│       ├── auth-typed.service.ts    # Пример типизированного сервиса
│       └── property-typed.service.ts # Пример типизированного сервиса
├── package.json
└── OPENAPI_TYPES.md              # Подробная документация
```

## Использование

### Базовое использование

```typescript
import type {
  ApiPropertyCreateRequest,
  ApiPropertyCreateResponse,
  ApiPropertyListParams,
} from "@/lib/api-types";

// Типизированный запрос
const params: ApiPropertyListParams = {
  query: "квартира",
  type: "APARTMENT",
  priceMin: 1000000,
  page: 1,
  limit: 12,
};

const response = await apiClient.get<ApiPropertyListResponse>(
  "/api/properties",
  params
);
```

### Использование в сервисах

См. примеры в:
- `src/services/auth-typed.service.ts`
- `src/services/property-typed.service.ts`

### Использование с React Query

```typescript
import { useQuery } from "@tanstack/react-query";
import { propertyTypedService } from "@/services/property-typed.service";
import type { ApiPropertyListParams } from "@/lib/api-types";

const { data, isLoading } = useQuery({
  queryKey: ["properties", filters],
  queryFn: () => propertyTypedService.getProperties(filters),
});

// data автоматически типизирован как ApiPropertyListResponse
```

## Команды

```bash
# Генерация типов
npm run generate:api-types

# Проверка типов
npm run tscheck

# Сборка (автоматически генерирует типы)
npm run build
```

## Преимущества

1. ✅ **Типобезопасность**: Все запросы и ответы проверяются на этапе компиляции
2. ✅ **Автодополнение**: IDE предоставляет автодополнение для всех полей
3. ✅ **Рефакторинг**: Изменения в API сразу видны в TypeScript ошибках
4. ✅ **Документация**: Типы служат живой документацией API
5. ✅ **Нет `any`**: Строгая типизация без использования `any`

## Обновление типов

Когда бэкенд обновляет OpenAPI спецификацию:

1. Запустите синхронизацию:
   ```bash
   npm run sync:api
   ```
2. Исправьте ошибки типов (если есть)
3. Коммитьте изменения:
   ```bash
   git add src/types/api.ts
   git commit -m "Update API types"
   ```

## Дополнительная документация

Подробная документация доступна в файле `OPENAPI_TYPES.md`.
