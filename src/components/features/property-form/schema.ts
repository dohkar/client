import * as z from "zod";

export const propertySchema = z
  .object({
    title: z.string().min(10, "Минимум 10 символов").max(200, "Максимум 200 символов"),
    dealType: z.enum(["SALE", "BUY", "RENT_OUT", "RENT_IN", "EXCHANGE"]).default("SALE"),
    price: z.number().min(0).optional().nullable(),
    location: z.string().min(5, "Адрес должен быть не менее 5 символов"),
    region: z.enum(["Chechnya", "Ingushetia", "Other"]),
    cityId: z.string().uuid().optional().or(z.literal("")),
    street: z.string().optional(),
    house: z.string().optional(),
    type: z.enum(["apartment", "house", "land", "commercial"]),
    rooms: z.number().optional(),
    floor: z.number().min(0).optional().nullable(),
    area: z.number().min(1, "Площадь должна быть больше 0"),
    description: z
      .string()
      .min(50, "Минимум 50 символов")
      .max(2000, "Максимум 2000 символов"),
    features: z.array(z.string()).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
  .refine(
    (data) => {
      if (data.dealType !== "BUY") return (data.price ?? 0) > 0;
      return true;
    },
    { message: "Укажите цену", path: ["price"] }
  );

export type PropertyFormData = z.infer<typeof propertySchema>;

export function buildLocationFromComponents(c: {
  region?: string;
  city?: string;
  street?: string;
  house?: string;
}): string {
  return [c.region, c.city, c.street, c.house].filter(Boolean).join(", ");
}

export const formatNumberWithSpaces = (value: number | string): string => {
  const numStr = String(value).replace(/\s/g, "");
  if (!numStr) return "";
  const num = parseFloat(numStr);
  if (isNaN(num)) return "";
  return Math.floor(num).toLocaleString("ru-RU");
};

export const parseFormattedNumber = (value: string): number => {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
