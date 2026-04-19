"use client";

import {
  useCallback,
  useState,
  type MutableRefObject,
  type ChangeEvent,
  type FC,
} from "react";
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CitySearchSelect } from "@/components/features/CitySearchSelect";
import { SectionCard } from "@/components/features/property-form/SectionCard";
import { ExternalLink, LocateFixed, MapPin } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { ListingFormData } from "../schema";
import type { CityDto } from "@/types";
import { yandexMapsPointUrl } from "@/lib/maps-external-link";
import { toast } from "sonner";

const REGION_OPTIONS: Array<{ value: ListingFormData["region"]; label: string }> = [
  { value: "Chechnya", label: "Чечня" },
  { value: "Ingushetia", label: "Ингушетия" },
  { value: "Other", label: "Другое" },
];

interface ListingRealEstateAddressSectionProps {
  register: UseFormRegister<ListingFormData>;
  setValue: UseFormSetValue<ListingFormData>;
  watch: UseFormWatch<ListingFormData>;
  cities: CityDto[];
  regionIdForCities?: string;
  isGeocoding: boolean;
  onMapCoordinatesChange: (lat: number, lon: number) => void;
  coordsSourceRef: MutableRefObject<"geocode" | "map" | null>;
  geolocationEnabled?: boolean;
}

const getRegionLabel = (regionValue: ListingFormData["region"] | undefined) =>
  REGION_OPTIONS.find((option) => option.value === regionValue)?.label ?? "Регион";

export const ListingRealEstateAddressSection: FC<
  ListingRealEstateAddressSectionProps
> = ({
  register,
  setValue,
  watch,
  cities,
  regionIdForCities,
  isGeocoding,
  onMapCoordinatesChange,
  coordsSourceRef,
  geolocationEnabled = true,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const latitude = watch("realEstate.latitude");
  const longitude = watch("realEstate.longitude");
  const hasCoords = typeof latitude === "number" && typeof longitude === "number";

  const location = watch("location") ?? "";
  const region = watch("region");
  const cityId = watch("cityId") ?? "";
  const street = watch("street") ?? "";
  const house = watch("house") ?? "";

  const handleGeolocation = useCallback(() => {
    if (!geolocationEnabled) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Геолокация недоступна в этом браузере.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onMapCoordinatesChange(pos.coords.latitude, pos.coords.longitude);
        setIsLocating(false);
      },
      () => {
        toast.error("Не удалось получить координаты. Разрешите доступ к геолокации.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 }
    );
  }, [geolocationEnabled, onMapCoordinatesChange]);

  const updateField =
    (field: "street" | "house") => (e: ChangeEvent<HTMLInputElement>) => {
      coordsSourceRef.current = "geocode";
      setValue(field, e.target.value);
    };

  const handleRegionChange = useCallback(
    (value: string) => {
      coordsSourceRef.current = "geocode";
      setValue("region", value as ListingFormData["region"]);
      setValue("cityId", "");
    },
    [coordsSourceRef, setValue]
  );

  const handleCityChange = useCallback(
    (value: string) => {
      coordsSourceRef.current = "geocode";
      setValue("cityId", value);
    },
    [coordsSourceRef, setValue]
  );

  return (
    <SectionCard
      title='Адрес и расположение'
      icon={<MapPin className='h-4 w-4 text-primary' />}
    >
      <input type='hidden' {...register("location")} />
      <div className='mb-3 flex items-center gap-2 text-sm text-muted-foreground'>
        {isGeocoding && <Spinner className='h-4 w-4 text-primary' />}
        <MapPin className='h-4 w-4 shrink-0' />
        <span className='truncate'>{location || "Заполните регион и город"}</span>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
        <div className='space-y-1.5'>
          <Label className='text-sm font-medium'>
            Регион <span className='text-destructive'>*</span>
          </Label>
          <Select value={region} onValueChange={handleRegionChange}>
            <SelectTrigger className='h-10' aria-label='Регион'>
              <span className='truncate'>{getRegionLabel(region)}</span>
            </SelectTrigger>
            <SelectContent>
              {REGION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-1.5'>
          <Label className='text-sm font-medium'>
            Город <span className='text-destructive'>*</span>
          </Label>
          <CitySearchSelect
            value={cityId}
            onValueChange={handleCityChange}
            cities={cities}
            disabled={!regionIdForCities}
            placeholder={
              cities.length === 0 ? "Сначала выберите регион" : "Выберите город"
            }
            className='h-10'
          />
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='listing-re-street' className='text-sm font-medium'>
            Улица
          </Label>
          <Input
            id='listing-re-street'
            value={street}
            onChange={updateField("street")}
            placeholder='ул. Ленина'
            className='h-10'
          />
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='listing-re-house' className='text-sm font-medium'>
            Дом
          </Label>
          <Input
            id='listing-re-house'
            value={house}
            onChange={updateField("house")}
            placeholder='10'
            className='h-10'
          />
        </div>
      </div>

      <div className='mt-4 flex flex-col gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='w-fit'
          disabled={!geolocationEnabled || isLocating}
          onClick={handleGeolocation}
        >
          {isLocating ? (
            <Spinner className='mr-2 h-4 w-4' />
          ) : (
            <LocateFixed className='mr-2 h-4 w-4' aria-hidden />
          )}
          Определить по геолокации
        </Button>
        <p className='text-xs text-muted-foreground'>
          Координаты и адрес подставляются через DaData по полям адреса или по GPS.
        </p>
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
