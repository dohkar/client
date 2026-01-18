# Генерация TypeScript типов из OpenAPI

Этот проект использует автоматическую генерацию TypeScript типов из OpenAPI спецификации бэкенда.

## 📋 Обзор

Типы генерируются напрямую с сервера с помощью инструмента [openapi-typescript](https://github.com/drwpow/openapi-typescript).

## 🚀 Быстрый старт

### Синхронизация API (рекомендуется)

```bash
npm run sync:api
```

Этот скрипт:
1. Загружает OpenAPI спецификацию с сервера
2. Валидирует спецификацию
3. Генерирует TypeScript типы в `src/types/api.ts`
4. Проверяет типы на ошибки

### Только генерация типов

```bash
npm run generate:api-types
```

Генерирует типы без проверки (используется при сборке).

### Автоматическая генерация

Типы автоматически генерируются перед сборкой проекта:

```bash
npm run build  # Автоматически запустит generate:api-types перед сборкой
```

## 📁 Структура файлов

```
client/
├── src/
│   ├── types/
│   │   ├── api.ts              # ⚠️ Автогенерируемый файл (не редактировать!)
│   │   └── index.ts             # Экспорт типов
│   ├── lib/
│   │   └── api-types.ts         # Утилиты для работы с типами API
│   └── services/
│       ├── auth-typed.service.ts    # Пример типизированного сервиса
│       └── property-typed.service.ts # Пример типизированного сервиса
└── package.json
```

## 🔧 Использование

### Базовые типы

```typescript
import type {
  UserResponseDto,
  PropertyResponseDto,
  CreatePropertyDto,
} from "@/types";

// Использование DTO из OpenAPI
const user: UserResponseDto = {
  id: "123",
  email: "user@example.com",
  name: "John Doe",
  isPremium: false,
  role: "USER",
  createdAt: "2024-01-01T00:00:00Z",
};
```

### Типы для эндпоинтов

```typescript
import type {
  PropertyListParams,
  PropertyListResponse,
  PropertyCreateRequest,
  PropertyCreateResponse,
} from "@/types";

// Параметры запроса
const params: PropertyListParams = {
  query: "квартира",
  type: "APARTMENT",
  priceMin: 1000000,
  page: 1,
  limit: 12,
};

// Типизированный запрос
const response: PropertyListResponse = await apiClient.get(
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { propertyTypedService } from "@/services/property-typed.service";
import type { PropertyCreateRequest } from "@/types";

// Запрос с полной типизацией
const { data, isLoading } = useQuery({
  queryKey: ["properties", filters],
  queryFn: () => propertyTypedService.getProperties(filters),
});

// data автоматически типизирован как PropertyListResponse
// TypeScript предоставляет автодополнение для всех полей

// Мутация с типизацией
const createMutation = useMutation({
  mutationFn: (data: PropertyCreateRequest) =>
    propertyTypedService.createProperty(data),
  onSuccess: (data) => {
    // data автоматически типизирован как PropertyCreateResponse
    console.log("Создано объявление:", data.id);
  },
});
```

## 🛠️ Утилиты для работы с типами

Файл `src/lib/api-types.ts` содержит утилиты для извлечения типов:

### Извлечение типа запроса

```typescript
import type { RequestBody } from "@/types";

type CreatePropertyRequest = RequestBody<"/api/properties", "post">;
```

### Извлечение типа ответа

```typescript
import type { ResponseData } from "@/types";

type PropertyResponse = ResponseData<"/api/properties/{id}", "get">;
```

### Извлечение параметров

```typescript
import type { RequestParams } from "@/types";

type PropertyListParams = RequestParams<"/api/properties", "get">;
```

### Работа с операциями

```typescript
import type {
  OperationResponse,
  OperationRequestBody,
  OperationParams,
} from "@/types";

// Тип ответа операции
type AuthResponse = OperationResponse<"AuthController_loginWithPhoneAndPassword", 200>;

// Тип тела запроса операции
type LoginRequest = OperationRequestBody<"AuthController_loginWithPhoneAndPassword">;

// Тип параметров операции
type UserParams = OperationParams<"UsersController_getUserById">;
```

## ✅ Преимущества

1. **Типобезопасность**: Все запросы и ответы проверяются на этапе компиляции
2. **Автодополнение**: IDE предоставляет автодополнение для всех полей
3. **Рефакторинг**: Изменения в API сразу видны в TypeScript ошибках
4. **Документация**: Типы служат живой документацией API
5. **Нет `any`**: Строгая типизация без использования `any`

## 🔄 Обновление типов

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

## 📝 Best Practices

1. **Не редактируйте `src/types/api.ts` вручную** - файл перезаписывается при генерации
2. **Используйте утилиты из `api-types.ts`** для удобной работы с типами
3. **Создавайте типизированные сервисы** вместо прямого использования `apiClient`
4. **Проверяйте типы перед коммитом**: `npm run tscheck`
5. **Обновляйте типы регулярно** при изменении API

## 🐛 Troubleshooting

### Ошибка: "Cannot find module '@/types/api'"

Убедитесь, что типы сгенерированы:
```bash
npm run sync:api
```

### Ошибка: "Type 'X' is not assignable to type 'Y'"

Это означает, что ваш код не соответствует OpenAPI спецификации. Проверьте:
1. Правильность типов в запросе/ответе
2. Обязательные поля
3. Enum значения

### Типы не обновляются

Убедитесь, что:
1. Спецификация актуальна (генерируется напрямую с сервера)
2. Скрипт генерации выполнен успешно
3. TypeScript сервер перезапущен (в VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server")

## 🔗 Полезные ссылки

- [openapi-typescript документация](https://github.com/drwpow/openapi-typescript)
- [OpenAPI спецификация](https://swagger.io/specification/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
