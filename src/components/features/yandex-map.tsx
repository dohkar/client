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
  /** При перетаскивании маркера — вызывается с новыми координатами. Геокодинг — снаружи. */
  onChangeCoordinates?: (latitude: number, longitude: number) => void;
}

declare global {
  interface Window {
    ymaps3?: {
      ready: Promise<void>;
      import: (module: string) => Promise<{
        YMapDefaultMarker?: new (options: {
          coordinates: [number, number];
          title?: string;
        }) => YmapsMarkerInstance;
        YMapZoomControl?: new (options?: unknown) => unknown;
        [key: string]: unknown;
      }>;
      YMap: new (
        container: HTMLElement,
        options: { location: { center: [number, number]; zoom: number } },
        children?: unknown[]
      ) => YmapsMapInstance;
      YMapDefaultSchemeLayer: new (options?: unknown) => unknown;
      YMapDefaultFeaturesLayer: new (options?: unknown) => unknown;
      YMapControls: new (options?: { position?: string }) => {
        addChild: (child: unknown) => void;
      };
      YMapZoomControl: new (options?: unknown) => unknown;
      YMapGeolocationControl: new () => unknown;
      YMapMarker?: new (options: YmapsMarkerOptions) => YmapsMarkerInstance;
    };
  }
}

interface YmapsMarkerOptions {
  coordinates: [number, number];
  mapFollowsOnDrag?: boolean;
  draggable?: boolean;
}

interface YmapsMarkerInstance {
  destroy?: () => void;
  coordinates?: [number, number];
  update?: (opts: Partial<YmapsMarkerOptions>) => void;
  addEventListener?: (event: string, cb: () => void) => void;
  events?: { add: (event: string, cb: () => void) => void };
}

interface YmapsMapInstance {
  destroy: () => void;
  addChild: (child: unknown) => void;
}

export function YandexMap({
  latitude,
  longitude,
  zoom = 15,
  height = 400,
  className = "",
  markerTitle,
  onChangeCoordinates,
}: YandexMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{
    map: YmapsMapInstance;
    marker: YmapsMarkerInstance | null;
    observer?: MutationObserver;
  } | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scriptLoadedRef = useRef(false);
  const onChangeRef = useRef(onChangeCoordinates);
  onChangeRef.current = onChangeCoordinates;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existingScript && window.ymaps3) {
      scriptLoadedRef.current = true;
      setTimeout(() => setIsApiReady(true), 100);
    }
  }, []);

  useEffect(() => {
    if (!isApiReady || !mapContainerRef.current) return;

    const initMap = async () => {
      try {
        if (typeof window === "undefined" || !window.ymaps3) {
          setError("Yandex Maps API не загружен. Проверьте подключение к интернету.");
          setIsLoading(false);
          return;
        }

        try {
          await Promise.race([
            window.ymaps3.ready,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Таймаут загрузки API")), 10000)
            ),
          ]);
        } catch {
          throw new Error("Превышено время ожидания загрузки Yandex Maps API");
        }

        if (mapInstanceRef.current?.map) {
          mapInstanceRef.current.map.destroy();
          mapInstanceRef.current = null;
        }

        if (!window.ymaps3.YMap || !window.ymaps3.YMapDefaultSchemeLayer) {
          throw new Error("Необходимые классы Yandex Maps API не найдены");
        }

        const container = mapContainerRef.current;
        if (!container) throw new Error("Контейнер карты не найден");

        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = window.ymaps3;

        const map = new YMap(
          container,
          { location: { center: [longitude, latitude], zoom } },
          [new YMapDefaultSchemeLayer(), new YMapDefaultFeaturesLayer()]
        );

        const { YMapControls } = window.ymaps3;
        const controls = new YMapControls({ position: "right" });
        map.addChild(controls);

        try {
          const uiTheme = (await window.ymaps3.import(
            "@yandex/ymaps3-default-ui-theme"
          )) as { YMapZoomControl?: new (opts?: unknown) => unknown };
          if (uiTheme?.YMapZoomControl) {
            controls.addChild(new uiTheme.YMapZoomControl({}));
          }
        } catch {
          // Зум по колесику доступен
        }

        const draggable = Boolean(onChangeCoordinates);
        let marker: YmapsMarkerInstance | null = null;

        if (draggable && window.ymaps3.YMapMarker) {
          marker = new window.ymaps3.YMapMarker({
            coordinates: [longitude, latitude],
            mapFollowsOnDrag: false,
            draggable: true,
          }) as YmapsMarkerInstance;

          const notifyCoordinates = () => {
            const coords = marker?.coordinates;
            if (coords && Array.isArray(coords) && coords.length >= 2) {
              onChangeRef.current?.(coords[1], coords[0]);
            }
          };

          if (typeof marker?.addEventListener === "function") {
            marker.addEventListener("update", notifyCoordinates);
          } else if (marker?.events?.add) {
            marker.events.add("update", notifyCoordinates);
          }
        } else {
          try {
            const uiTheme = (await window.ymaps3.import(
              "@yandex/ymaps3-default-ui-theme"
            )) as {
              YMapDefaultMarker?: new (opts: {
                coordinates: [number, number];
                title?: string;
              }) => YmapsMarkerInstance;
            };
            if (uiTheme?.YMapDefaultMarker) {
              marker = new uiTheme.YMapDefaultMarker({
                coordinates: [longitude, latitude],
                title: markerTitle || "Местоположение",
              });
            }
          } catch {
            if (window.ymaps3.YMapMarker) {
              marker = new window.ymaps3.YMapMarker({
                coordinates: [longitude, latitude],
                mapFollowsOnDrag: true,
              }) as YmapsMarkerInstance;
            }
          }
        }

        if (marker) map.addChild(marker);

        const hideCopyrights = () => {
          container
            .querySelectorAll(
              '.ymaps3x0--map-copyrights, [class*="copyrights"], [class*="copyright"]'
            )
            .forEach((el) => {
              const html = el as HTMLElement;
              html.style.display = "none";
              html.style.visibility = "hidden";
              html.style.opacity = "0";
            });
        };
        hideCopyrights();
        setTimeout(hideCopyrights, 500);
        setTimeout(hideCopyrights, 1000);

        let observer: MutationObserver | undefined;
        if (typeof MutationObserver !== "undefined") {
          observer = new MutationObserver(hideCopyrights);
          observer.observe(container, { childList: true, subtree: true });
        }

        mapInstanceRef.current = { map, marker, observer };
        setIsLoading(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Не удалось загрузить карту";
        setError(msg);
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      const inst = mapInstanceRef.current;
      if (inst) {
        inst.observer?.disconnect();
        inst.map.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [isApiReady, latitude, longitude, zoom, markerTitle, Boolean(onChangeCoordinates)]);

  const handleScriptLoad = () => {
    if (typeof window !== "undefined" && window.ymaps3) {
      scriptLoadedRef.current = true;
      setTimeout(() => setIsApiReady(true), 200);
    } else {
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

  const handleScriptError = () => {
    setError(
      "Ошибка 403: Проблема с API ключом Yandex Maps.\n\n" +
        "Решение:\n" +
        "1. Перейдите в Yandex Developer Dashboard (https://developer.tech.yandex.ru/)\n" +
        "2. В разделе 'Ограничения по HTTP Referer' добавьте:\n" +
        "   http://localhost:* и https://ваш-домен.com/*\n" +
        "3. Сохраните изменения (активация до 15 минут)"
    );
    setIsLoading(false);
  };

  const API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || "";
  const apiUrl = API_KEY
    ? `https://api-maps.yandex.ru/v3/?apikey=${API_KEY}&lang=ru_RU`
    : "https://api-maps.yandex.ru/v3/?lang=ru_RU";

  return (
    <>
      {typeof window !== "undefined" &&
        !scriptLoadedRef.current &&
        !document.querySelector('script[src*="api-maps.yandex.ru"]') && (
          <Script
            src={apiUrl}
            strategy='lazyOnload'
            onLoad={handleScriptLoad}
            onError={() => handleScriptError()}
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
