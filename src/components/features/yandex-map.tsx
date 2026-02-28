"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";

// --- Constants (no magic numbers)
const DEFAULT_ZOOM = 15;
const DEFAULT_HEIGHT = 400;
const API_LOAD_TIMEOUT_MS = 10_000;
const API_READY_DELAY_MS = 100;
const DRAG_END_DELAY_MS = 120;

// --- Public API
export interface YandexMapProps {
  /** Center of the map [longitude, latitude] */
  center: [number, number];
  /** Marker position [lng, lat]. Null = marker hidden */
  markerPosition?: [number, number] | null;
  zoom?: number;
  height?: number;
  className?: string;
  /** Fired when user finishes dragging the marker. (lng, lat) */
  onMarkerMove?: (lng: number, lat: number) => void;
  /** Fired when user clicks on the map. (lng, lat) */
  onMapClick?: (lng: number, lat: number) => void;
}

// --- Yandex Maps API types (v3, minimal surface)
interface YMapLocation {
  center: [number, number];
  zoom: number;
}

interface YMapMarkerOptions {
  coordinates: [number, number];
  draggable?: boolean;
  mapFollowsOnDrag?: boolean;
  title?: string;
}

interface YMapMarkerInstance {
  update: (opts: Partial<YMapMarkerOptions>) => void;
  destroy?: () => void;
  coordinates?: [number, number];
  addEventListener?: (event: string, handler: (e: MapClickEvent) => void) => void;
  events?: { add: (event: string, handler: (e: MapClickEvent) => void) => void };
}

/** YMapDefaultMarker from theme: options include onDragMove(coords) */
interface YMapDefaultMarkerOptions extends YMapMarkerOptions {
  size?: "small" | "normal" | "large";
  iconName?: string;
  onDragMove?: (coordinates: [number, number]) => void;
}

interface MapClickEvent {
  coordinates?: [number, number];
  originalEvent?: { coordinates?: [number, number] };
}

interface YMapInstance {
  destroy: () => void;
  addChild: (child: unknown) => void;
  removeChild: (child: unknown) => void;
  setLocation: (opts: Partial<YMapLocation>) => void;
  addEventListener?: (event: string, handler: (e: MapClickEvent) => void) => void;
  events?: { add: (event: string, handler: (e: MapClickEvent) => void) => void };
}

interface YMapOptions {
  location: YMapLocation;
  showScaleInCopyrights?: boolean;
}

declare global {
  interface Window {
    ymaps3?: {
      ready: Promise<void>;
      import: (module: string) => Promise<Record<string, unknown>>;
      YMap: new (
        container: HTMLElement,
        options: YMapOptions,
        children?: unknown[]
      ) => YMapInstance;
      YMapDefaultSchemeLayer: new (opts?: unknown) => unknown;
      YMapDefaultFeaturesLayer: new (opts?: unknown) => unknown;
      YMapControls: new (opts?: { position?: string }) => { addChild: (c: unknown) => void };
      YMapMarker?: new (opts: YMapMarkerOptions) => YMapMarkerInstance;
    };
  }
}

type DefaultMarkerConstructor = new (opts: YMapDefaultMarkerOptions) => YMapMarkerInstance;

function getMapClickCoords(e: MapClickEvent): [number, number] | null {
  const coords = e?.coordinates ?? e?.originalEvent?.coordinates;
  if (coords && coords.length >= 2) return [coords[0], coords[1]];
  return null;
}

function addMapEventListener(
  target: YMapInstance | YMapMarkerInstance,
  event: string,
  handler: (e: MapClickEvent) => void
): void {
  if (target.events?.add) {
    target.events.add(event, handler);
  } else if (typeof target.addEventListener === "function") {
    target.addEventListener(event, handler);
  }
}

export function YandexMap({
  center,
  markerPosition = null,
  zoom = DEFAULT_ZOOM,
  height = DEFAULT_HEIGHT,
  className = "",
  onMarkerMove,
  onMapClick,
}: YandexMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YMapInstance | null>(null);
  const markerRef = useRef<YMapMarkerInstance | null>(null);
  const markerOnMapRef = useRef(false);
  const [apiReady, setApiReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptTagNeeded, setScriptTagNeeded] = useState(true);

  const onMarkerMoveRef = useRef(onMarkerMove);
  const onMapClickRef = useRef(onMapClick);
  const centerRef = useRef(center);
  const zoomRef = useRef(zoom);
  const markerPositionRef = useRef(markerPosition);
  const skipNextMarkerEventRef = useRef(false);
  const dragEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDragCoordsRef = useRef<[number, number]>([0, 0]);
  const defaultMarkerClassRef = useRef<DefaultMarkerConstructor | null>(null);

  // Keep refs in sync with props (only in effects, not during render)
  useEffect(() => {
    onMarkerMoveRef.current = onMarkerMove;
    onMapClickRef.current = onMapClick;
    centerRef.current = center;
    zoomRef.current = zoom;
    markerPositionRef.current = markerPosition;
  });

  // 1) Script injection and API ready
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (hasScript && window.ymaps3) {
      const t = setTimeout(() => {
        setScriptTagNeeded(false);
        setApiReady(true);
      }, API_READY_DELAY_MS);
      return () => clearTimeout(t);
    }
  }, []);

  // 2) Single init: map once, marker created once when first needed
  useEffect(() => {
    if (!apiReady || !containerRef.current || mapRef.current) return;

    let destroyed = false;
    const container = containerRef.current;

    const init = async () => {
      if (!window.ymaps3) {
        setError("Yandex Maps API не загружен.");
        return;
      }
      try {
        await Promise.race([
          window.ymaps3.ready,
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error("timeout")), API_LOAD_TIMEOUT_MS)
          ),
        ]);
      } catch {
        setError("Превышено время ожидания загрузки Yandex Maps API");
        return;
      }

      const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapControls } =
        window.ymaps3;
      if (!YMap || !YMapDefaultSchemeLayer) {
        setError("Необходимые классы Yandex Maps API не найдены");
        return;
      }

      const initialCenter = centerRef.current;
      const initialZoom = zoomRef.current;
      const map = new YMap(
        container,
        {
          location: { center: [...initialCenter], zoom: initialZoom },
          showScaleInCopyrights: true,
        },
        [new YMapDefaultSchemeLayer(), new YMapDefaultFeaturesLayer()]
      ) as YMapInstance;

      const controls = new YMapControls({ position: "right" });
      map.addChild(controls);
      let YMapDefaultMarkerClass: DefaultMarkerConstructor | null = null;
      try {
        const ui = (await window.ymaps3.import(
          "@yandex/ymaps3-default-ui-theme"
        )) as { YMapZoomControl?: new (opts?: unknown) => unknown; YMapDefaultMarker?: DefaultMarkerConstructor };
        if (ui?.YMapZoomControl) controls.addChild(new ui.YMapZoomControl({}));
        YMapDefaultMarkerClass = ui?.YMapDefaultMarker ?? null;
        defaultMarkerClassRef.current = YMapDefaultMarkerClass;
      } catch {
        // zoom via scroll only
      }

      const initialMarkerPos = markerPositionRef.current;
      const hasMarkerPos =
        Array.isArray(initialMarkerPos) && initialMarkerPos.length >= 2;
      const draggable = Boolean(onMarkerMoveRef.current || onMapClickRef.current);
      let marker: YMapMarkerInstance | null = null;

      if (hasMarkerPos) {
        const coords: [number, number] = [initialMarkerPos[0], initialMarkerPos[1]];
        if (YMapDefaultMarkerClass) {
          const onDragMove = (coordinates: [number, number]) => {
            lastDragCoordsRef.current = coordinates;
            if (dragEndTimeoutRef.current) clearTimeout(dragEndTimeoutRef.current);
            dragEndTimeoutRef.current = setTimeout(() => {
              dragEndTimeoutRef.current = null;
              if (skipNextMarkerEventRef.current) {
                skipNextMarkerEventRef.current = false;
                return;
              }
              onMarkerMoveRef.current?.(coordinates[0], coordinates[1]);
            }, DRAG_END_DELAY_MS);
          };
          marker = new YMapDefaultMarkerClass({
            coordinates: coords,
            draggable,
            title: "Местоположение",
            size: "normal",
            iconName: "fallback",
            onDragMove: draggable ? onDragMove : undefined,
          });
        } else if (window.ymaps3.YMapMarker) {
          marker = new window.ymaps3.YMapMarker({
            coordinates: coords,
            draggable,
            mapFollowsOnDrag: false,
            title: "Местоположение",
          });
          if (draggable) {
            const onDragEnd = () => {
              if (skipNextMarkerEventRef.current) {
                skipNextMarkerEventRef.current = false;
                return;
              }
              const c = markerRef.current?.coordinates;
              if (c && c.length >= 2) onMarkerMoveRef.current?.(c[0], c[1]);
            };
            addMapEventListener(marker, "dragend", onDragEnd);
          }
        }
        if (marker) {
          map.addChild(marker);
          markerOnMapRef.current = true;
        }
      }

      if (onMapClickRef.current) {
        const onMapClickHandler = (e: MapClickEvent) => {
          const coords = getMapClickCoords(e);
          if (coords) {
            onMapClickRef.current?.(coords[0], coords[1]);
            const m = markerRef.current;
            if (m) {
              skipNextMarkerEventRef.current = true;
              m.update({ coordinates: coords });
            }
          }
        };
        addMapEventListener(map, "click", onMapClickHandler);
      }

      if (!destroyed) {
        mapRef.current = map;
        markerRef.current = marker;
        // Apply latest props in case they changed during async init
        map.setLocation({
          center: [...centerRef.current],
          zoom: zoomRef.current,
        });
      } else {
        map.destroy();
        marker?.destroy?.();
      }
    };

    init();

    return () => {
      destroyed = true;
      if (dragEndTimeoutRef.current) {
        clearTimeout(dragEndTimeoutRef.current);
        dragEndTimeoutRef.current = null;
      }
      const map = mapRef.current;
      const marker = markerRef.current;
      if (map) {
        if (marker) {
          try {
            map.removeChild(marker);
          } catch {
            /* already removed */
          }
          marker.destroy?.();
        }
        map.destroy();
        mapRef.current = null;
        markerRef.current = null;
        markerOnMapRef.current = false;
      }
    };
  }, [apiReady]); // center/zoom/markerPosition intentionally not in deps — synced in separate effect

  // 3) Sync props → map and marker (no callbacks)
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;

    if (map?.setLocation) {
      map.setLocation({ center: [...center], zoom });
    }

    const hasMarkerPos = Array.isArray(markerPosition) && markerPosition.length >= 2;

    if (marker) {
      if (!hasMarkerPos) {
        if (markerOnMapRef.current) {
          try {
            map?.removeChild(marker);
          } catch {
            /* ignore */
          }
          markerOnMapRef.current = false;
        }
      } else {
        const [lng, lat] = markerPosition;
        skipNextMarkerEventRef.current = true;
        marker.update({ coordinates: [lng, lat] });
        if (!markerOnMapRef.current && map) {
          map.addChild(marker);
          markerOnMapRef.current = true;
        }
      }
    }
    if (!marker && hasMarkerPos && map) {
      const [lng, lat] = markerPosition;
      const coords: [number, number] = [lng, lat];
      const draggable = Boolean(onMarkerMoveRef.current || onMapClickRef.current);
      const DefaultMarkerClass = defaultMarkerClassRef.current;

      if (DefaultMarkerClass) {
        const onDragMove = (coordinates: [number, number]) => {
          lastDragCoordsRef.current = coordinates;
          if (dragEndTimeoutRef.current) clearTimeout(dragEndTimeoutRef.current);
          dragEndTimeoutRef.current = setTimeout(() => {
            dragEndTimeoutRef.current = null;
            if (skipNextMarkerEventRef.current) {
              skipNextMarkerEventRef.current = false;
              return;
            }
            onMarkerMoveRef.current?.(coordinates[0], coordinates[1]);
          }, DRAG_END_DELAY_MS);
        };
        const newMarker = new DefaultMarkerClass({
          coordinates: coords,
          draggable,
          title: "Местоположение",
          size: "normal",
          iconName: "fallback",
          onDragMove: draggable ? onDragMove : undefined,
        });
        map.addChild(newMarker);
        markerRef.current = newMarker;
        markerOnMapRef.current = true;
      } else if (window.ymaps3?.YMapMarker) {
        const newMarker = new window.ymaps3.YMapMarker({
          coordinates: coords,
          draggable,
          mapFollowsOnDrag: false,
          title: "Местоположение",
        }) as YMapMarkerInstance;
        map.addChild(newMarker);
        markerRef.current = newMarker;
        markerOnMapRef.current = true;
        if (draggable && (newMarker.events?.add || typeof newMarker.addEventListener === "function")) {
          const onDragEnd = () => {
            if (skipNextMarkerEventRef.current) {
              skipNextMarkerEventRef.current = false;
              return;
            }
            const c = markerRef.current?.coordinates;
            if (c && c.length >= 2) onMarkerMoveRef.current?.(c[0], c[1]);
          };
          addMapEventListener(newMarker, "dragend", onDragEnd);
        }
      }
    }
  }, [center, zoom, markerPosition]);

  const handleScriptLoad = useCallback(() => {
    setScriptTagNeeded(false);
    if (typeof window !== "undefined" && window.ymaps3) {
      setTimeout(() => setApiReady(true), API_READY_DELAY_MS);
    } else {
      setTimeout(() => {
        if (typeof window !== "undefined" && window.ymaps3) {
          setApiReady(true);
        } else {
          setError("Yandex Maps API не загружен.");
        }
      }, 1000);
    }
  }, []);

  const handleScriptError = useCallback(() => {
    setError(
      "Ошибка загрузки Yandex Maps. Проверьте API ключ и ограничения по HTTP Referer в кабинете разработчика."
    );
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY ?? "";
  const scriptUrl = apiKey
    ? `https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=ru_RU`
    : "https://api-maps.yandex.ru/v3/?lang=ru_RU";

  const showScript = typeof window !== "undefined" && scriptTagNeeded;

  return (
    <>
      {showScript && (
        <Script src={scriptUrl} strategy="lazyOnload" onLoad={handleScriptLoad} onError={handleScriptError} />
      )}
      <div
        ref={containerRef}
        role="application"
        aria-label="Интерактивная карта"
        className={`yandex-map-container ${className}`.trim()}
        style={{
          width: "100%",
          height: `${height}px`,
          borderRadius: 8,
          overflow: "hidden",
          background: "#eee",
          position: "relative",
        }}
      >
        {!apiReady && !error && (
          <div
            className="animate-pulse bg-muted flex items-center justify-center"
            style={{ position: "absolute", inset: 0 }}
            aria-hidden
          >
            <span className="text-muted-foreground text-sm">Загрузка карты…</span>
          </div>
        )}
        {error && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fef2f2",
              color: "#b91c1c",
              padding: 20,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </>
  );
}
