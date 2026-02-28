# Ревью интеграции Yandex Maps (карта + геокодер)

По документации [JavaScript API v3](https://yandex.com/maps-api/docs/js-api/) и [Geocoder API](https://yandex.com/dev/geocode/doc/en/).

---

## 1. Карта (yandex-map.tsx)

### Что сделано хорошо
- **Controlled-компонент**: центр, зум и маркер только из props, без дублирования state.
- **Одна инициализация**: карта и маркер создаются один раз, обновляются через `setLocation` / `marker.update()`.
- **Скрипт**: загрузка через `Next.js Script` с `strategy="lazyOnload"`, URL v3 с `apikey` и `lang=ru_RU` — по документации.
- **Слои**: `YMapDefaultSchemeLayer` + `YMapDefaultFeaturesLayer` — стандартная схема и объекты.
- **Контролы**: `YMapControls` + `YMapZoomControl` из `@yandex/ymaps3-default-ui-theme`.
- **События**: `dragend` маркера и `click` карты, колбэки через refs, защита от циклов при синхронизации props.
- **Cleanup**: в unmount вызываются `removeChild`, `destroy`, обнуление refs — утечек нет.
- **Типизация**: свои типы для API без `any`.

### Что улучшить по документации

| Пункт | Рекомендация | Статус |
|-------|--------------|--------|
| **showScaleInCopyrights** | В [примерах](https://yandex.com/dev/jsapi30/doc/en/examples/cases/create-draggable-marker) в опции карты передаётся `showScaleInCopyrights: true` — в подвале показывается масштаб. | Добавить в опции YMap. |
| **Маркер** | В API v3 рекомендуют `YMapDefaultMarker` из `@yandex/ymaps3-default-ui-theme` с `draggable: true` и колбэком `onDragMove(coordinates)`. Сейчас используется `YMapMarker` (низкоуровневый) и чтение `marker.coordinates` после `dragend`. | Можно перейти на YMapDefaultMarker и передавать координаты из `onDragMove` (при отпускании — последний вызов или отдельный `dragend`, если есть в теме). |
| **Доступность** | Контейнер карты должен быть помечен для скринридеров. | Добавить `role="application"` и `aria-label="Интерактивная карта"`. |
| **Состояние загрузки** | Документация не требует обязательного плейсхолдера; текущее поведение (контейнер сразу, ошибка при сбое) допустимо. | Опционально: минимальный skeleton до `apiReady`. |

### Визул
- Высота и скругление задаются через props/стили — ок.
- Фон контейнера `#eee` до загрузки карты — ок.
- Сообщение об ошибке с контрастным фоном и текстом — ок.
- Стиль маркера задаётся API (YMapMarker или YMapDefaultMarker); при переходе на YMapDefaultMarker можно задать `size`, `iconName` по гайдам.

---

## 2. Геокодер (клиент + API routes)

### Клиент (yandex-geocoder.ts)
- Запросы только на свой бэкенд (`/api/geocode`, `/api/reverse-geocode`) — ключ не светится на клиенте.
- Сборка запроса: страна (по умолчанию «Россия»), регион, город, улица, дом — соответствует [рекомендациям](https://yandex.com/dev/geocode/doc/en/concepts/input) Геокодера.
- Разбор ответа: `response.GeoObjectCollection.featureMember[0].GeoObject`, `Point.pos`, `GeocoderMetaData.text`, `Address.Components` — формат [Geocoder API](https://yandex.com/dev/geocode/doc/en/response).
- **Важно**: в 1.x поле `Point.pos` — «longitude latitude». В коде: `longitude = pos[0]`, `latitude = pos[1]`.
- В комментариях указано про debounce для reverseGeocode — в форме он есть (setTimeout), ок.

### POST /api/geocode
- URL: `https://geocode-maps.yandex.ru/1.x/`, параметры `apikey`, `geocode`, `format=json`, `lang=ru_RU`, `results=5` — по [формату запроса](https://yandex.com/dev/geocode/doc/en/request).
- Ключ: `YANDEX_GEOCODER_API_KEY` или `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` — ок.
- Ответ проксируется как есть; клиент сам парсит структуру — ок.
- Ошибки логируются, пользователю возвращается понятное сообщение — ок.

### POST /api/reverse-geocode
- Параметр `geocode=lon,lat` — в документации для обратного запроса передаётся строка «долгота,широта» — ок.
- `format=json`, `lang=ru_RU`, `results=1` — ок.
- Остальные замечания те же, что для geocode.

### Что можно добавить (опционально)
- **Кэширование**: для обратного геокодирования можно кэшировать по паре (lat, lon) на короткое время, чтобы не дергать API при повторных запросах (например, при переключении вкладок).
- **Лимиты**: в кабинете разработчика Яндекса настроить квоты и при необходимости возвращать 429 с Retry-After; на бэкенде можно добавить простой rate limit по IP.

---

## 3. Использование в приложении

### PropertyForm
- Геокодирование по адресу с задержкой и защитой от петли map ↔ geocode — ок.
- При смене координат с карты вызывается reverseGeocode с debounce — ок.
- Карта показывается только при валидных latitude/longitude, передаются `center`, `markerPosition`, `onMarkerMove`, `onMapClick` — ок.

### PropertyMapSection (страница объявления)
- Карта только при наличии координат; центр и маркер = координаты объявления; зум 17 для детализации адреса — ок.
- Можно добавить ссылку «Открыть в Яндекс.Картах» с URL вида  
  `https://yandex.ru/maps/?pt={lon},{lat}&z=17` — улучшит UX.

---

## 4. Итоговый чеклист улучшений

- [x] Добавить `showScaleInCopyrights: true` в опции YMap.
- [x] Добавить `role="application"` и `aria-label` у контейнера карты.
- [x] Перейти на YMapDefaultMarker с `onDragMove` (debounce 120ms → onMarkerMove при отпускании); fallback на YMapMarker + dragend.
- [x] Ссылка «Открыть в Яндекс.Картах» в PropertyMapSection.
- [x] Скелетон загрузки карты до `apiReady` (animate-pulse + «Загрузка карты…»).
- [x] Кэш reverse-geocode: 5 мин TTL, ключ по округлённым координатам (4 знака); периодическая очистка.
- [x] Rate limit геокодера: 60 запросов/мин на IP для `/api/geocode` и `/api/reverse-geocode`.
