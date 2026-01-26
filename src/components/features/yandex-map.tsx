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
        YMapDefaultMarker: new (options: {
          coordinates: [number, number];
          title?: string;
        }) => {
          destroy: () => void;
        };
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
  } | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scriptLoadedRef = useRef(false);

  // Yandex Maps API key - можно вынести в переменные окружения
  // Для тестирования можно использовать без ключа, но с ограничениями
  const API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || "";

  // Альтернативная загрузка скрипта, если Next.js Script не работает
  useEffect(() => {
    if (typeof window === "undefined" || scriptLoadedRef.current) {
      return;
    }

    // Проверяем, не загружен ли уже скрипт
    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existingScript || window.ymaps3) {
      scriptLoadedRef.current = true;
      if (window.ymaps3) {
        setTimeout(() => setIsApiReady(true), 100);
      }
      return;
    }

    // Загружаем скрипт вручную, если его еще нет
    // Если API ключ вызывает 403, пробуем без ключа
    const loadScript = (useApiKey: boolean) => {
      const script = document.createElement("script");
      script.src = useApiKey && API_KEY
        ? `https://api-maps.yandex.ru/v3/?apikey=${API_KEY}&lang=ru_RU`
        : "https://api-maps.yandex.ru/v3/?lang=ru_RU";
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        setTimeout(() => {
          if (window.ymaps3) {
            setIsApiReady(true);
          } else {
            setError("Yandex Maps API не инициализирован");
            setIsLoading(false);
          }
        }, 200);
      };
      script.onerror = (event) => {
        console.error("Ошибка загрузки скрипта Yandex Maps:", event);
        
        // Если ошибка с API ключом, пробуем без ключа
        if (useApiKey && API_KEY) {
          console.warn("Попытка загрузить API без ключа из-за ошибки с ключом");
          // Удаляем скрипт с ошибкой
          script.remove();
          // Пробуем без ключа
          loadScript(false);
        } else {
          const errorMsg = "Не удалось загрузить Yandex Maps API. Возможные причины:\n" +
            "1. API ключ не активирован или неправильный\n" +
            "2. Не настроены ограничения по HTTP Referer в настройках ключа\n" +
            "3. Домен не разрешен в настройках API ключа\n" +
            "4. Проблемы с подключением к интернету";
          setError(errorMsg);
          setIsLoading(false);
        }
      };
      document.head.appendChild(script);
    };

    // Пробуем сначала с ключом, если он есть
    loadScript(!!API_KEY);

    return () => {
      // Не удаляем скрипт при размонтировании, так как он может использоваться другими компонентами
    };
  }, [API_KEY]);

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
        const { YMapControls, YMapZoomControl } = window.ymaps3;
        const controls = new YMapControls({ position: "right" });
        map.addChild(controls);

        const zoomControl = new YMapZoomControl();
        controls.addChild(zoomControl);

        // Пытаемся использовать стилизованный маркер, если доступен
        let marker: unknown;
        try {
          const { YMapDefaultMarker } = await window.ymaps3.import('@yandex/ymaps3-default-ui-theme');
          marker = new YMapDefaultMarker({
            coordinates: [longitude, latitude],
            title: markerTitle || "Местоположение",
          });
        } catch {
          // Fallback: используем простой маркер через YMapMarker, если доступен
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

        mapInstanceRef.current = { map, marker };
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
      if (mapInstanceRef.current?.map) {
        mapInstanceRef.current.map.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [isApiReady, latitude, longitude, zoom, markerTitle]);

  const handleScriptLoad = () => {
    // Проверяем, что API действительно загружен
    if (typeof window !== "undefined" && window.ymaps3) {
      // Небольшая задержка для гарантии, что API полностью загружен
      setTimeout(() => {
        setIsApiReady(true);
      }, 200);
    } else {
      // Если API не загрузился, пробуем еще раз через небольшую задержку
      setTimeout(() => {
        if (typeof window !== "undefined" && window.ymaps3) {
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
      {/* Next.js Script компонент - если он не работает, используется альтернативная загрузка в useEffect */}
      <Script
        src={apiUrl}
        strategy="lazyOnload"
        onLoad={handleScriptLoad}
        onError={() => {
          // Если ошибка с ключом, альтернативная загрузка в useEffect попробует без ключа
          handleScriptError("Ошибка загрузки скрипта (возможно 403 - проблема с API ключом)");
        }}
        onReady={() => {
          // Дополнительная проверка после ready
          if (typeof window !== "undefined" && window.ymaps3) {
            handleScriptLoad();
          }
        }}
      />
      <div
        ref={mapContainerRef}
        className={className}
        style={{
          width: "100%",
          height: `${height}px`,
          borderRadius: "8px",
          overflow: "hidden",
          background: "#eee",
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
