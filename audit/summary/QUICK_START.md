# ⚡ Быстрый старт - Dohkar

## 🚀 За 3 минуты до первого запуска

### Шаг 1: Зависимости уже установлены ✅

```bash
npm install
```

### Шаг 2: Запустите dev сервер 🏃

```bash
npm run dev
```

### Шаг 3: Откройте в браузере 🌐

**Сервер уже запущен на:**
- 🏠 Главная: [http://localhost:3000](http://localhost:3000)
- ℹ️ О нас: [http://localhost:3000/about](http://localhost:3000/about)
- 📧 Контакты: [http://localhost:3000/contact](http://localhost:3000/contact)
- 🔌 API Health: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 📚 Что изучить дальше?

### 1. Документация (в порядке чтения)
1. **README.md** - Общий обзор проекта
2. **ARCHITECTURE.md** - Архитектура и принципы
3. **API_GUIDE.md** - Работа с API
4. **SETUP.md** - Детальная установка
5. **PROJECT_SUMMARY.md** - Что создано
6. **FILES_CREATED.md** - Список файлов

### 2. Примеры использования

#### Создать новую страницу

```bash
# Создайте файл: app/my-page/page.tsx
```

```tsx
import { Container } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function MyPage() {
  return (
    <Container>
      <Card>
        <CardHeader>
          <CardTitle>Моя страница</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Содержимое страницы</p>
        </CardContent>
      </Card>
    </Container>
  );
}
```

#### Использовать компоненты

```tsx
import { Button, Input, Card } from "@/components/ui";

<Button variant="primary" size="lg">
  Кнопка
</Button>

<Input
  label="Email"
  placeholder="email@example.com"
  error="Неверный email"
/>

<Card variant="elevated">
  <CardHeader>
    <CardTitle>Заголовок</CardTitle>
  </CardHeader>
  <CardContent>Содержимое</CardContent>
</Card>
```

#### Использовать хуки

```tsx
import { useLocalStorage, useDebounce, useMediaQuery } from "@/hooks";

const [value, setValue] = useLocalStorage('key', 'default');
const debouncedValue = useDebounce(searchTerm, 500);
const isMobile = useMediaQuery('(max-width: 768px)');
```

#### Работать с API

```tsx
import { apiClient } from "@/lib/api-client";

// GET запрос
const data = await apiClient.get('/api/endpoint');

// POST запрос
const result = await apiClient.post('/api/endpoint', { data });
```

---

## 🎯 Структура проекта (кратко)

```
src/
├── components/      # Компоненты
│   ├── ui/         # Button, Input, Card
│   ├── layout/     # Header, Footer, Container
│   └── features/   # Ваши feature компоненты
├── lib/            # Утилиты и API клиент
├── hooks/          # Custom хуки
├── types/          # TypeScript типы
├── services/       # API сервисы
├── constants/      # Константы
└── config/         # Конфигурация
```

---

## 🔥 Горячие команды

```bash
# Разработка
npm run dev          # Запустить dev сервер (УЖЕ ЗАПУЩЕН!)

# Production
npm run build        # Собрать для production
npm run start        # Запустить production сервер

# Качество кода
npm run lint         # Проверить код
```

---

## 📦 Что уже создано и работает

### ✅ UI Компоненты
- Button (5 вариантов)
- Input (с валидацией)
- Card (с секциями)

### ✅ Layout
- Header (навигация)
- Footer (информация)
- Container

### ✅ Утилиты
- cn() - классы
- formatDate() - даты
- formatCurrency() - валюта
- isValidEmail() - email
- validatePassword() - пароль

### ✅ Хуки
- useLocalStorage()
- useDebounce()
- useMediaQuery()

### ✅ API
- HTTP клиент
- Health check endpoint
- Пример CRUD API

### ✅ Страницы
- Главная
- О нас
- Контакты

---

## 💡 Полезные ссылки

### Внутренняя документация
- [README.md](./README.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [API_GUIDE.md](./API_GUIDE.md)
- [SETUP.md](./SETUP.md)

### Внешняя документация
- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🎨 Примеры кода

### Страница с формой

```tsx
"use client";

import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function FormPage() {
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Ваша логика
  };

  return (
    <Container size="md" className="py-12">
      <Card>
        <CardHeader>
          <CardTitle>Форма</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" className="w-full">
              Отправить
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
```

### API Route

```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  const data = []; // Ваши данные

  const response: ApiResponse<typeof data> = {
    status: 'success',
    data,
  };

  return NextResponse.json(response);
}
```

---

## 🎉 Готово!

**Проект полностью готов к разработке!**

Сервер запущен на http://localhost:3000

Приятной разработки! 🚀
