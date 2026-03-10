import * as z from "zod";

const realEstateSchema = z.object({
  type: z.enum(["APARTMENT", "HOUSE", "LAND", "COMMERCIAL"]),
  rooms: z.number().optional(),
  area: z.number().min(1, "Площадь должна быть больше 0"),
  features: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const vehicleSchema = z.object({
  brandId: z.string().uuid("Выберите марку"),
  model: z.string().min(1, "Укажите модель"),
  year: z.number().min(1900).max(2100),
  mileage: z.number().min(0).optional(),
  bodyType: z.string().optional(),
  engine: z.string().optional(),
  transmission: z.string().optional(),
});

const electronicsSchema = z.object({
  brandId: z.string().uuid("Выберите бренд"),
  productType: z.string().min(1, "Укажите тип"),
  model: z.string().min(1, "Укажите модель"),
  storage: z.string().optional(),
  condition: z.string().optional(),
});

export const listingSchema = z
  .object({
    category: z.enum(["REAL_ESTATE", "VEHICLE", "ELECTRONICS"]),
    title: z.string().min(10, "Минимум 10 символов").max(200, "Максимум 200 символов"),
    dealType: z.enum(["SALE", "BUY", "RENT_OUT", "RENT_IN", "EXCHANGE"]).default("SALE"),
    price: z.number().min(0).optional().nullable(),
    location: z.string().optional(),
    regionId: z.string().uuid().optional().or(z.literal("")),
    cityId: z.string().uuid().optional().or(z.literal("")),
    street: z.string().optional(),
    house: z.string().optional(),
    floor: z.number().min(0).optional().nullable(),
    description: z.string().min(50, "Минимум 50 символов").max(2000, "Максимум 2000 символов"),
    realEstate: realEstateSchema.optional(),
    vehicle: vehicleSchema.optional(),
    electronics: electronicsSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.dealType !== "BUY") return (data.price ?? 0) > 0;
      return true;
    },
    { message: "Укажите цену", path: ["price"] }
  )
  .refine(
    (data) => {
      if (data.category === "REAL_ESTATE") return !!data.realEstate;
      return true;
    },
    { message: "Заполните характеристики недвижимости", path: ["realEstate"] }
  )
  .refine(
    (data) => {
      if (data.category === "VEHICLE") return !!data.vehicle;
      return true;
    },
    { message: "Заполните характеристики транспорта", path: ["vehicle"] }
  )
  .refine(
    (data) => {
      if (data.category === "ELECTRONICS") return !!data.electronics;
      return true;
    },
    { message: "Заполните характеристики электроники", path: ["electronics"] }
  );

export type ListingFormData = z.infer<typeof listingSchema>;
