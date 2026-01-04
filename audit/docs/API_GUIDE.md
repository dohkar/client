# Руководство по работе с API

## 🌐 API Клиент

### Базовое использование

API клиент находится в `src/lib/api-client.ts` и предоставляет методы для работы с HTTP запросами.

```typescript
import { apiClient } from '@/lib/api-client';

// GET запрос
const data = await apiClient.get('/api/example');

// POST запрос
const result = await apiClient.post('/api/example', {
  name: 'Test',
  value: 123
});

// PUT запрос
await apiClient.put('/api/example', { id: 1, name: 'Updated' });

// PATCH запрос
await apiClient.patch('/api/example', { name: 'Patched' });

// DELETE запрос
await apiClient.delete('/api/example?id=1');
```

## 📦 Сервисы

Сервисы - это обертки над API клиентом для конкретных доменов.

### Создание сервиса

Создайте файл в `src/services/your-service.service.ts`:

```typescript
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types';

// Определите типы данных
interface User {
  id: string;
  name: string;
  email: string;
}

// Создайте сервис
export const userService = {
  // Получить всех пользователей
  async getAll(): Promise<ApiResponse<User[]>> {
    return apiClient.get<ApiResponse<User[]>>('/api/users');
  },

  // Получить пользователя по ID
  async getById(id: string): Promise<ApiResponse<User>> {
    return apiClient.get<ApiResponse<User>>(`/api/users/${id}`);
  },

  // Создать пользователя
  async create(data: Omit<User, 'id'>): Promise<ApiResponse<User>> {
    return apiClient.post<ApiResponse<User>>('/api/users', data);
  },

  // Обновить пользователя
  async update(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put<ApiResponse<User>>(`/api/users/${id}`, data);
  },

  // Удалить пользователя
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/api/users/${id}`);
  },
};
```

### Использование сервиса

```typescript
import { userService } from '@/services/user.service';

// В компоненте или хуке
async function fetchUsers() {
  try {
    const response = await userService.getAll();
    if (response.status === 'success') {
      console.log(response.data);
    }
  } catch (error) {
    console.error('Ошибка:', error);
  }
}
```

## 🎯 API Routes (Next.js)

### Пример health check

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

export async function GET() {
  const response: ApiResponse<{ status: string }> = {
    status: 'success',
    data: { status: 'ok' },
  };
  return NextResponse.json(response);
}
```

### CRUD операции

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/users
export async function GET(request: NextRequest) {
  // Получение параметров запроса
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page');

  // Ваша логика
  return NextResponse.json({ data: [] });
}

// POST /api/users
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Ваша логика создания
  return NextResponse.json({ data: body }, { status: 201 });
}
```

### Динамические маршруты

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: { id: string };
}

// GET /api/users/:id
export async function GET(
  request: NextRequest,
  { params }: Params
) {
  const { id } = params;
  // Получить пользователя по ID
  return NextResponse.json({ data: { id } });
}

// PUT /api/users/:id
export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  const { id } = params;
  const body = await request.json();
  // Обновить пользователя
  return NextResponse.json({ data: { id, ...body } });
}

// DELETE /api/users/:id
export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  const { id } = params;
  // Удалить пользователя
  return NextResponse.json({ message: 'Deleted' });
}
```

## 🔐 Обработка ошибок

### В API клиенте

API клиент автоматически обрабатывает ошибки HTTP:

```typescript
try {
  const data = await apiClient.get('/api/endpoint');
} catch (error) {
  if (error && typeof error === 'object' && 'status' in error) {
    const apiError = error as ApiError;
    console.error(`Ошибка ${apiError.status}: ${apiError.message}`);
  }
}
```

### В API Routes

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Валидация
    if (!body.name) {
      return NextResponse.json(
        { status: 'error', message: 'Имя обязательно' },
        { status: 400 }
      );
    }

    // Ваша логика
    return NextResponse.json({ status: 'success', data: body });

  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
```

## 📝 Типы данных

### ApiResponse

```typescript
interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}
```

### ApiError

```typescript
interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
```

### PaginatedResponse

```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

## 🧪 Тестирование API

### Примеры запросов

```bash
# Health check
curl http://localhost:3000/api/health

# GET с параметрами
curl http://localhost:3000/api/example?page=1&limit=10

# POST с данными
curl -X POST http://localhost:3000/api/example \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","value":123}'

# PUT запрос
curl -X PUT http://localhost:3000/api/example \
  -H "Content-Type: application/json" \
  -d '{"id":1,"name":"Updated"}'

# DELETE запрос
curl -X DELETE http://localhost:3000/api/example?id=1
```

## 🔑 Best Practices

1. **Всегда типизируйте данные**
   ```typescript
   const data = await apiClient.get<ApiResponse<User[]>>('/api/users');
   ```

2. **Используйте сервисы для группировки API методов**
   - Создавайте отдельный сервис для каждого домена
   - Экспортируйте один объект с методами

3. **Обрабатывайте ошибки**
   - Используйте try-catch блоки
   - Показывайте пользователю понятные сообщения

4. **Валидируйте данные**
   - На клиенте перед отправкой
   - На сервере при получении

5. **Используйте константы для эндпоинтов**
   ```typescript
   // src/constants/routes.ts
   export const API_ENDPOINTS = {
     users: '/api/users',
     posts: '/api/posts',
   } as const;
   ```

6. **Логируйте запросы в development**
   ```typescript
   if (process.env.NODE_ENV === 'development') {
     console.log('API Request:', endpoint, options);
   }
   ```
