"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type KeyboardEvent,
} from "react";
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/features/property-form/SectionCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, LocateFixed, MapPin } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { ListingFormData } from "../schema";
import type { RegionDto } from "@/types/property";
import type { GeocodeResult } from "@/lib/dadata-geocoder";
import { applyGeocodeResultToListingForm } from "../apply-address-from-dadata";
import { yandexMapsPointUrl } from "@/lib/maps-external-link";
import { toast } from "sonner";
import { useAddressSuggestions } from "@/hooks/use-address-suggestions";
import { REGION_FRONTEND_LABELS, type RegionName } from "@/lib/regions";

const LISTBOX_ID = "listing-address-listbox";

interface ListingAddressSuggestStepProps {
  register: UseFormRegister<ListingFormData>;
  setValue: UseFormSetValue<ListingFormData>;
  watch: UseFormWatch<ListingFormData>;
  errors: Record<string, { message?: string } | undefined>;
  regions: RegionDto[];
  /** Регион из формы — усиление подсказок и плейсхолдер (если уже не «Другие»). */
  preferredRegion?: RegionName;
  isResolvingLocation: boolean;
  onGeolocation: (lat: number, lon: number) => void;
}

export const ListingAddressSuggestStep: FC<ListingAddressSuggestStepProps> = ({
  register,
  setValue,
  watch,
  errors,
  regions,
  preferredRegion = "Other",
  isResolvingLocation,
  onGeolocation,
}) => {
  const { onBlur: regLocationBlur, ...locationField } = register("location");

  const location = watch("location") ?? "";
  const latitude = watch("realEstate.latitude");
  const longitude = watch("realEstate.longitude");
  const hasCoords = typeof latitude === "number" && typeof longitude === "number";

  const suggestOptions = useMemo(() => {
    if (!preferredRegion || preferredRegion === "Other") return undefined;
    const label = REGION_FRONTEND_LABELS[preferredRegion];
    return label ? { boostRegion: label } : undefined;
  }, [preferredRegion]);

  const {
    suggestions,
    suggestLoading,
    listOpen,
    setListOpen,
    suppressSuggestionsAfterPick,
  } = useAddressSuggestions(location, suggestOptions);

  const suggestionSig = useMemo(
    () => suggestions.map((s) => s.formattedAddress).join("\0"),
    [suggestions]
  );

  const [activeIndex, setActiveIndex] = useState(-1);
  /** Синхронный индекс для Enter сразу после ArrowDown (state отстаёт на один кадр). */
  const activeIndexRef = useRef(-1);

  useEffect(() => {
    if (suggestions.length === 0) {
      activeIndexRef.current = -1;
      setActiveIndex(-1);
      return;
    }
    setActiveIndex((prev) => {
      let next: number;
      if (prev >= 0 && prev < suggestions.length) next = prev;
      else next = 0;
      activeIndexRef.current = next;
      return next;
    });
  }, [suggestionSig, suggestions.length]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const handlePick = useCallback(
    async (item: GeocodeResult) => {
      suppressSuggestionsAfterPick();
      try {
        await applyGeocodeResultToListingForm(item, setValue, regions, {
          mode: "userPick",
        });
        toast.success("Адрес выбран", { duration: 1200 });
        activeIndexRef.current = -1;
        setActiveIndex(-1);
      } catch {
        toast.error("Не удалось применить адрес.");
      }
    },
    [regions, setValue, suppressSuggestionsAfterPick]
  );

  const handleGeolocationClick = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Геолокация недоступна в этом браузере.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onGeolocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        toast.error("Не удалось получить координаты. Разрешите доступ к геолокации.");
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 }
    );
  }, [onGeolocation]);

  const blurTimerRef = useRef<number | null>(null);

  const handleBlurInput = useCallback(() => {
    if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current);
    blurTimerRef.current = window.setTimeout(() => setListOpen(false), 180);
  }, [setListOpen]);

  const handleFocusInput = useCallback(() => {
    if (blurTimerRef.current) {
      window.clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    if (suggestions.length > 0) setListOpen(true);
  }, [suggestions.length, setListOpen]);

  const handleKeyDownInput = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setListOpen(false);
        activeIndexRef.current = -1;
        setActiveIndex(-1);
        return;
      }

      if (suggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!listOpen) setListOpen(true);
        setActiveIndex((i) => {
          const next = i < 0 ? 0 : Math.min(suggestions.length - 1, i + 1);
          activeIndexRef.current = next;
          return next;
        });
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!listOpen) setListOpen(true);
        setActiveIndex((i) => {
          const base = i < 0 ? 0 : i;
          const next = Math.max(0, base - 1);
          activeIndexRef.current = next;
          return next;
        });
        return;
      }

      if (e.key === "Enter" && listOpen) {
        const idx = activeIndexRef.current;
        const item = idx >= 0 ? suggestions[idx] : undefined;
        if (item) {
          e.preventDefault();
          void handlePick(item);
        }
      }
    },
    [handlePick, listOpen, setListOpen, suggestions]
  );

  const placeholder = useMemo(() => {
    if (preferredRegion && preferredRegion !== "Other") {
      const label = REGION_FRONTEND_LABELS[preferredRegion];
      if (label) return `${label}, район или улица`;
    }
    return "Город, улица, дом";
  }, [preferredRegion]);

  const activeOptionId =
    listOpen && activeIndex >= 0 && suggestions[activeIndex]
      ? `listing-address-opt-${activeIndex}`
      : undefined;

  return (
    <SectionCard title='Адрес' icon={<MapPin className='h-4 w-4 text-primary' />}>
      <p className='mb-3 text-sm text-muted-foreground'>
        Подсказки — только по России. После паузы в наборе выберите вариант из списка или
        уточните точку по GPS: для геолокации сохраняются регион и город без улицы и дома;
        полный адрес и индекс — когда сами выберете подсказку или введёте вручную.
      </p>

      <div className='relative space-y-1.5'>
        <Label htmlFor='listing-address-suggest' className='text-sm font-medium'>
          Адрес объекта <span className='text-destructive'>*</span>
        </Label>
        <div className='relative'>
          <Input
            id='listing-address-suggest'
            role='combobox'
            aria-autocomplete='list'
            aria-expanded={listOpen}
            aria-controls={LISTBOX_ID}
            aria-activedescendant={activeOptionId}
            {...locationField}
            onFocus={handleFocusInput}
            onKeyDown={handleKeyDownInput}
            onBlur={(ev) => {
              void regLocationBlur(ev);
              handleBlurInput();
            }}
            placeholder={placeholder}
            className='h-11 pr-10'
            autoComplete='off'
          />
          {(suggestLoading || isResolvingLocation) && (
            <Spinner className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          )}
        </div>
        {errors.location && (
          <p className='text-xs text-destructive'>{errors.location.message}</p>
        )}

        {listOpen && suggestions.length > 0 && (
          <div
            className='absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-popover shadow-md'
            onMouseDown={(e) => e.preventDefault()}
          >
            <ScrollArea className='max-h-56'>
              <ul
                id={LISTBOX_ID}
                role='listbox'
                aria-label='Подсказки адреса'
                className='p-1'
              >
                {suggestions.map((s, idx) => (
                  <li
                    key={`${s.formattedAddress}-${idx}`}
                    id={`listing-address-opt-${idx}`}
                    role='option'
                    aria-selected={idx === activeIndex}
                    className='list-none'
                  >
                    <button
                      type='button'
                      className={`flex w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent ${
                        idx === activeIndex ? "bg-accent" : ""
                      }`}
                      onClick={() => void handlePick(s)}
                      onMouseEnter={() => {
                        activeIndexRef.current = idx;
                        setActiveIndex(idx);
                      }}
                    >
                      <span className='line-clamp-2'>{s.formattedAddress}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}
      </div>

      <div className='mt-4 flex flex-col gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='w-fit'
          disabled={isResolvingLocation}
          onClick={handleGeolocationClick}
        >
          {isResolvingLocation ? (
            <Spinner className='mr-2 h-4 w-4' />
          ) : (
            <LocateFixed className='mr-2 h-4 w-4' aria-hidden />
          )}
          Определить по геолокации
        </Button>
        {hasCoords && (
          <p className='text-xs text-muted-foreground'>
            Координаты:{" "}
            <span className='font-mono text-foreground/90'>
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </span>
            {" · "}
            <a
              href={yandexMapsPointUrl(longitude, latitude)}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-0.5 text-primary hover:underline'
            >
              <ExternalLink className='h-3 w-3' aria-hidden />
              На карте
            </a>
          </p>
        )}
      </div>
    </SectionCard>
  );
};
