"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

interface YandexMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  height?: number;
  className?: string;
  markerTitle?: string;
}

declare global {
  interface Window {
    ymaps3?: {
      ready: Promise<void>;
      import: (module: string) => Promise<{
        YMapDefaultMarker?: new (options: {
          coordinates: [number, number];
          title?: string;
        }) => {
          destroy: () => void;
        };
        YMapZoomControl?: new (options?: unknown) => unknown;
        [key: string]: unknown;
      }>;
      YMap: new (
        container: HTMLElement,
        options: {
          location: {
            center: [number, number];
            zoom: number;
          };
        },
        children?: unknown[]
      ) => {
        destroy: () => void;
        addChild: (child: unknown) => void;
      };
      YMapDefaultSchemeLayer: new (options?: unknown) => unknown;
      YMapDefaultFeaturesLayer: new (options?: unknown) => unknown;
      YMapControls: new (options?: { position?: string }) => {
        addChild: (child: unknown) => void;
      };
      YMapZoomControl: new (options?: unknown) => unknown;
      YMapGeolocationControl: new () => unknown;
      YMapMarker?: new (options: {
        coordinates: [number, number];
        mapFollowsOnDrag?: boolean;
      }) => unknown;
    };
  }
}

export function YandexMap({
  latitude,
  longitude,
  zoom = 15,
  height = 400,
  className = "",
  markerTitle,
}: YandexMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{
    map: InstanceType<NonNullable<typeof window.ymaps3>["YMap"]>;
    marker: unknown;
    observer?: MutationObserver;
  } | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scriptLoadedRef = useRef(false);

  // Yandex Maps API key - можно вынести в переменные окружения
  // Для тестирования можно использовать без ключа, но с ограничениями
  const API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || "";

  // Проверяем, не загружен ли уже скрипт (для предотвращения двойной загрузки)
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Проверяем, не загружен ли уже скрипт
    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existingScript && window.ymaps3) {
      scriptLoadedRef.current = true;
      setTimeout(() => setIsApiReady(true), 100);
    }
  }, []);

  useEffect(() => {
    if (!isApiReady || !mapContainerRef.current) {
      return;
    }

    const initMap = async () => {
      try {
        // Проверяем наличие API
        if (typeof window === "undefined" || !window.ymaps3) {
          setError("Yandex Maps API не загружен. Проверьте подключение к интернету.");
          setIsLoading(false);
          return;
        }

        // Ждем готовности API с таймаутом
        try {
          await Promise.race([
            window.ymaps3.ready,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Таймаут загрузки API")), 10000)
            ),
          ]);
        } catch (timeoutError) {
          throw new Error("Превышено время ожидания загрузки Yandex Maps API");
        }

        // Очищаем предыдущий экземпляр карты, если есть
        if (mapInstanceRef.current?.map) {
          mapInstanceRef.current.map.destroy();
          mapInstanceRef.current = null;
        }

        // Проверяем наличие необходимых классов
        if (!window.ymaps3.YMap || !window.ymaps3.YMapDefaultSchemeLayer) {
          throw new Error("Необходимые классы Yandex Maps API не найдены");
        }

        // Проверяем, что контейнер существует
        const container = mapContainerRef.current;
        if (!container) {
          throw new Error("Контейнер карты не найден");
        }

        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = window.ymaps3;

        // Создаем карту с слоями
        const map = new YMap(
          container,
          {
            location: {
              center: [longitude, latitude],
              zoom: zoom,
            },
          },
          [
            new YMapDefaultSchemeLayer(),
            new YMapDefaultFeaturesLayer(),
          ]
        );

        // Добавляем элементы управления
        // YMapControls доступен в основном API
        const { YMapControls } = window.ymaps3;
        const controls = new YMapControls({ position: "right" });
        map.addChild(controls);

        // Импортируем YMapZoomControl из темы UI
        // Примечание: контролы зума опциональны, карта работает и без них
        try {
          const uiTheme = await window.ymaps3.import('@yandex/ymaps3-default-ui-theme') as any;
          // YMapZoomControl может быть в том же модуле
          if (uiTheme && typeof uiTheme.YMapZoomControl === 'function') {
            const zoomControl = new uiTheme.YMapZoomControl({});
            controls.addChild(zoomControl);
          }
        } catch (controlsError) {
          // Если контролы недоступны, карта будет без зума (но это не критично)
          // Пользователь может использовать колесико мыши для зума
          console.warn("Элементы управления зумом недоступны, используйте колесико мыши:", controlsError);
        }

        // Пытаемся использовать стилизованный маркер из темы UI
        let marker: unknown;
        try {
          const uiTheme = await window.ymaps3.import('@yandex/ymaps3-default-ui-theme') as any;
          
          // Создаем маркер
          if (uiTheme && typeof uiTheme.YMapDefaultMarker === 'function') {
            marker = new uiTheme.YMapDefaultMarker({
              coordinates: [longitude, latitude],
              title: markerTitle || "Местоположение",
            });
          }
        } catch (themeError) {
          // Fallback: используем простой маркер через YMapMarker, если доступен
          console.warn("Тема UI недоступна, используем базовые компоненты:", themeError);
          if (window.ymaps3.YMapMarker) {
            marker = new window.ymaps3.YMapMarker({
              coordinates: [longitude, latitude],
              mapFollowsOnDrag: true,
            });
          } else {
            // Если маркер недоступен, просто центрируем карту на координатах
            console.warn("Маркер недоступен, карта будет отцентрирована на координатах");
          }
        }

        if (marker) {
          map.addChild(marker);
        }

        // Скрываем водяной знак Yandex Maps после инициализации
        // ВНИМАНИЕ: Это может нарушать условия использования API
        // Для официального использования без водяного знака требуется коммерческая лицензия
        const hideCopyrights = () => {
          if (container) {
            const copyrights = container.querySelectorAll('.ymaps3x0--map-copyrights, [class*="copyrights"], [class*="copyright"]');
            copyrights.forEach((el) => {
              (el as HTMLElement).style.display = 'none';
              (el as HTMLElement).style.visibility = 'hidden';
              (el as HTMLElement).style.opacity = '0';
            });
          }
        };

        // Скрываем сразу и через небольшую задержку (элементы могут добавляться динамически)
        hideCopyrights();
        setTimeout(hideCopyrights, 500);
        setTimeout(hideCopyrights, 1000);

        // Наблюдаем за изменениями DOM и скрываем новые элементы copyright
        if (container && typeof MutationObserver !== 'undefined') {
          const observer = new MutationObserver(() => {
            hideCopyrights();
          });
          observer.observe(container, {
            childList: true,
            subtree: true,
          });
          
          // Сохраняем observer для очистки
          mapInstanceRef.current = { map, marker, observer };
        } else {
          mapInstanceRef.current = { map, marker };
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Ошибка инициализации карты:", err);
        const errorMessage = err instanceof Error ? err.message : "Не удалось загрузить карту";
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    initMap();

    // Очистка при размонтировании
    return () => {
      if (mapInstanceRef.current) {
        // Останавливаем observer
        if (mapInstanceRef.current.observer) {
          mapInstanceRef.current.observer.disconnect();
        }
        // Уничтожаем карту
        if (mapInstanceRef.current.map) {
          mapInstanceRef.current.map.destroy();
        }
        mapInstanceRef.current = null;
      }
    };
  }, [isApiReady, latitude, longitude, zoom, markerTitle]);

  const handleScriptLoad = () => {
    // Проверяем, что API действительно загружен
    if (typeof window !== "undefined" && window.ymaps3) {
      scriptLoadedRef.current = true;
      // Небольшая задержка для гарантии, что API полностью загружен
      setTimeout(() => {
        setIsApiReady(true);
      }, 200);
    } else {
      // Если API не загрузился, пробуем еще раз через небольшую задержку
      setTimeout(() => {
        if (typeof window !== "undefined" && window.ymaps3) {
          scriptLoadedRef.current = true;
          setIsApiReady(true);
        } else {
          setError("Yandex Maps API не загружен. Проверьте подключение к интернету.");
          setIsLoading(false);
        }
      }, 1000);
    }
  };

  const handleScriptError = (e: Error | string) => {
    console.error("Ошибка загрузки Yandex Maps API:", e);
    
    // 403 ошибка означает проблему с настройками API ключа
    const errorMessage = 
      "Ошибка 403: Проблема с API ключом Yandex Maps.\n\n" +
      "Решение:\n" +
      "1. Перейдите в Yandex Developer Dashboard (https://developer.tech.yandex.ru/)\n" +
      "2. Откройте настройки вашего API ключа\n" +
      "3. В разделе 'Ограничения по HTTP Referer' добавьте:\n" +
      "   - http://localhost:* (для разработки)\n" +
      "   - https://ваш-домен.com/* (для продакшена)\n" +
      "4. Сохраните изменения (активация может занять до 15 минут)\n\n" +
      "Или временно используйте API без ключа (с ограничениями).";
    
    setError(errorMessage);
    setIsLoading(false);
  };

  // Формируем URL для загрузки API
  // Правильный URL для Yandex Maps JS API 3.0: https://api-maps.yandex.ru/v3/
  // Примечание: Если API ключ вызывает 403, компонент автоматически попробует загрузить без ключа
  const apiUrl = API_KEY
    ? `https://api-maps.yandex.ru/v3/?apikey=${API_KEY}&lang=ru_RU`
    : "https://api-maps.yandex.ru/v3/?lang=ru_RU";

  return (
    <>
      {/* Загружаем скрипт только если он еще не загружен */}
      {typeof window !== "undefined" && !scriptLoadedRef.current && !document.querySelector('script[src*="api-maps.yandex.ru"]') && (
        <Script
          src={apiUrl}
          strategy="lazyOnload"
          onLoad={handleScriptLoad}
          onError={() => {
            handleScriptError("Ошибка загрузки скрипта (возможно 403 - проблема с API ключом)");
          }}
          onReady={() => {
            // Дополнительная проверка после ready
            if (typeof window !== "undefined" && window.ymaps3) {
              scriptLoadedRef.current = true;
              handleScriptLoad();
            }
          }}
        />
      )}
      <div
        ref={mapContainerRef}
        className={`${className} yandex-map-container`}
        style={{
          width: "100%",
          height: `${height}px`,
          borderRadius: "8px",
          overflow: "hidden",
          background: "#eee",
          position: "relative",
        }}
      >
        {isLoading && !error && (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f5f5f5",
              color: "#666",
            }}
          >
            Загрузка карты...
          </div>
        )}
        {error && (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fee",
              color: "#c33",
              padding: "20px",
              textAlign: "left",
              whiteSpace: "pre-line",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </>
  );
}
