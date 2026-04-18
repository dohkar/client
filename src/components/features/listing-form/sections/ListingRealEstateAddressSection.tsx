"use client";

import { useCallback, type MutableRefObject, type ChangeEvent, type FC } from "react";
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { CitySearchSelect } from "@/components/features/CitySearchSelect";
import { YandexMap } from "@/components/features/yandex-map";
import { SectionCard } from "@/components/features/property-form/SectionCard";
import { MapPin } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { ListingFormData } from "../schema";
import type { CityDto } from "@/types";

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
}) => {
  const latitude = watch("realEstate.latitude");
  const longitude = watch("realEstate.longitude");
  const hasCoords = typeof latitude === "number" && typeof longitude === "number";

  const location = watch("location") ?? "";
  const region = watch("region");
  const cityId = watch("cityId") ?? "";
  const street = watch("street") ?? "";
  const house = watch("house") ?? "";

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

      {hasCoords && (
        <div className='mt-4 space-y-1.5'>
          <Label className='text-sm font-medium flex items-center gap-1.5'>
            <MapPin className='h-3.5 w-3.5 text-muted-foreground' />
            Уточните на карте
          </Label>
          <p className='text-xs text-muted-foreground'>
            Перетащите маркер или кликните по карте
          </p>
          <div className='rounded-lg overflow-hidden border border-border/50 bg-muted/10'>
            <YandexMap
              center={[longitude, latitude]}
              markerPosition={[longitude, latitude]}
              zoom={16}
              height={220}
              onMarkerMove={(lng, lat) => onMapCoordinatesChange(lat, lng)}
              onMapClick={(lng, lat) => onMapCoordinatesChange(lat, lng)}
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
};
