# Super Admin Panel

Панель управления для суперадмина системы зарядных станций.

## Установка

```bash
npm install
```

## Настройка

1. Скопируйте `.env.local.example` в `.env.local`:
```bash
cp .env.local.example .env.local
```

2. Отредактируйте `.env.local` и укажите URL вашего бэкенда:
```
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_WS_URL=ws://localhost:8081
```

## Запуск

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## Структура проекта

- `app/` - Next.js App Router страницы и layouts
- `lib/` - Утилиты и API клиент
  - `api-client.ts` - API клиент для всех endpoints бэкенда
  - `auth.ts` - Утилиты для работы с авторизацией
- `hooks/` - React hooks
  - `use-websocket.ts` - Hook для WebSocket подключения
- `components/` - React компоненты

## API Client

Все API вызовы находятся в `lib/api-client.ts`. Используйте функции из этого файла для взаимодействия с бэкендом.

Пример:
```typescript
import { getDevices, remoteStartSession } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth';

const token = getAccessToken();
const devices = await getDevices(token!);
```

## WebSocket

Для real-time событий используйте hook `useWebSocket`:

```typescript
import { useWebSocket } from '@/hooks/use-websocket';
import { getAccessToken } from '@/lib/auth';

const { connected, subscribe } = useWebSocket({ token: getAccessToken() });

useEffect(() => {
  const unsubscribe = subscribe('device_update', (event) => {
    console.log('Device updated:', event.data);
  });
  return unsubscribe;
}, [subscribe]);
```

## Авторизация

Токены хранятся в `localStorage`. Используйте функции из `lib/auth.ts`:

- `getAccessToken()` - получить access token
- `setAccessToken(token)` - сохранить access token
- `getUser()` - получить данные пользователя
- `clearAuth()` - очистить все данные авторизации

