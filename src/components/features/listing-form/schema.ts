import * as z from "zod";
import { REGION_NAME_VALUES } from "@/lib/regions";

const realEstateSchema = z.object({
  type: z.enum(["APARTMENT", "HOUSE", "LAND", "COMMERCIAL"]),
  rooms: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    if (typeof val === "number" && Number.isNaN(val)) return undefined;
    return val;
  }, z.number().min(0, "Не меньше 0 (студия)").max(50).optional()),
  area: z.number().min(1, "Площадь должна быть больше 0"),
  features: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

/** Форма создания/редактирования объявления: только недвижимость. */
export const listingRealEstateFormSchema = z
  .object({
    category: z.literal("REAL_ESTATE"),
    title: z.string().min(10, "Минимум 10 символов").max(200, "Максимум 200 символов"),
    dealType: z.enum(["SALE", "BUY", "RENT_OUT", "RENT_IN", "EXCHANGE"]).default("SALE"),
    price: z.number().min(0).optional().nullable(),
    location: z.string().min(5, "Укажите адрес"),
    region: z.enum(REGION_NAME_VALUES),
    cityId: z.string().uuid().optional().or(z.literal("")),
    street: z.string().optional(),
    house: z.string().optional(),
    floor: z.number().min(0).optional().nullable(),
    description: z
      .string()
      .min(50, "Минимум 50 символов")
      .max(2000, "Максимум 2000 символов"),
    realEstate: realEstateSchema,
  })
  .refine(
    (data) => {
      if (data.dealType !== "BUY") return (data.price ?? 0) > 0;
      return true;
    },
    { message: "Укажите цену", path: ["price"] }
  );

export type ListingFormData = z.infer<typeof listingRealEstateFormSchema>;
