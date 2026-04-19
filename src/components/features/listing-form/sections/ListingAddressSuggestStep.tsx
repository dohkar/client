"use client";

import { useCallback, useRef, type FC } from "react";
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

interface ListingAddressSuggestStepProps {
  register: UseFormRegister<ListingFormData>;
  setValue: UseFormSetValue<ListingFormData>;
  watch: UseFormWatch<ListingFormData>;
  errors: Record<string, { message?: string } | undefined>;
  regions: RegionDto[];
  isResolvingLocation: boolean;
  onGeolocation: (lat: number, lon: number) => void;
}

export const ListingAddressSuggestStep: FC<ListingAddressSuggestStepProps> = ({
  register,
  setValue,
  watch,
  errors,
  regions,
  isResolvingLocation,
  onGeolocation,
}) => {
  const { onBlur: regLocationBlur, ...locationField } = register("location");

  const location = watch("location") ?? "";
  const latitude = watch("realEstate.latitude");
  const longitude = watch("realEstate.longitude");
  const hasCoords = typeof latitude === "number" && typeof longitude === "number";

  const {
    suggestions,
    suggestLoading,
    listOpen,
    setListOpen,
    suppressSuggestionsAfterPick,
  } = useAddressSuggestions(location);

  const handlePick = useCallback(
    async (item: GeocodeResult) => {
      suppressSuggestionsAfterPick();
      try {
        await applyGeocodeResultToListingForm(item, setValue, regions);
        toast.success("Адрес выбран", { duration: 1200 });
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

  /** В браузере id таймера — number (не NodeJS.Timeout). */
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

  return (
    <SectionCard title='Адрес' icon={<MapPin className='h-4 w-4 text-primary' />}>
      <p className='mb-3 text-sm text-muted-foreground'>
        Начните вводить адрес и выберите вариант из списка — подсказки появляются после
        короткой паузы в наборе. Координаты подставятся после выбора. При необходимости
        уточните точку по GPS.
      </p>

      <div className='relative space-y-1.5'>
        <Label htmlFor='listing-address-suggest' className='text-sm font-medium'>
          Адрес объекта <span className='text-destructive'>*</span>
        </Label>
        <div className='relative'>
          <Input
            id='listing-address-suggest'
            {...locationField}
            onFocus={handleFocusInput}
            onBlur={(e) => {
              void regLocationBlur(e);
              handleBlurInput();
            }}
            placeholder='Например: Грозный, проспект Путина 5'
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
              <ul className='p-1'>
                {suggestions.map((s, idx) => (
                  <li key={`${s.formattedAddress}-${idx}`} className='list-none'>
                    <button
                      type='button'
                      className='flex w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent'
                      onClick={() => void handlePick(s)}
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
