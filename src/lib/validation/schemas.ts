import { z } from "zod";

/**
 * Схема валидации для входа
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email обязателен")
    .email("Некорректный email адрес"),
  password: z
    .string()
    .min(8, "Пароль должен содержать минимум 8 символов")
    .max(100, "Пароль слишком длинный"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Схема валидации для регистрации
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Имя должно содержать минимум 2 символа")
      .max(50, "Имя слишком длинное"),
    email: z
      .string()
      .min(1, "Email обязателен")
      .email("Некорректный email адрес"),
    phone: z
      .string()
      .regex(
        /^(\+7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/,
        "Некорректный номер телефона"
      )
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Пароль должен содержать минимум 8 символов")
      .regex(/[A-Z]/, "Пароль должен содержать заглавную букву")
      .regex(/[a-z]/, "Пароль должен содержать строчную букву")
      .regex(/[0-9]/, "Пароль должен содержать цифру"),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "Необходимо согласиться с условиями использования",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Схема валидации для создания объявления
 */
export const createPropertySchema = z.object({
  dealType: z.enum(["sale", "rent"], {
    required_error: "Выберите тип сделки",
  }),
  propertyType: z.enum(["apartment", "house", "land", "commercial"], {
    required_error: "Выберите тип недвижимости",
  }),
  region: z.enum(["Chechnya", "Ingushetia", "Other"], {
    required_error: "Выберите регион",
  }),
  city: z.string().min(1, "Укажите город или населенный пункт"),
  address: z.string().min(5, "Укажите полный адрес"),
  price: z
    .number()
    .min(1, "Цена должна быть больше 0")
    .max(1000000000, "Цена слишком большая"),
  currency: z.enum(["RUB", "USD"]).default("RUB"),
  area: z
    .number()
    .min(1, "Площадь должна быть больше 0")
    .max(100000, "Площадь слишком большая"),
  rooms: z
    .number()
    .min(0)
    .max(20)
    .optional()
    .nullable(),
  floor: z.string().optional(),
  totalFloors: z.number().min(1).max(200).optional().nullable(),
  description: z
    .string()
    .min(20, "Описание должно содержать минимум 20 символов")
    .max(5000, "Описание слишком длинное"),
  features: z.array(z.string()).optional(),
  images: z
    .array(z.string())
    .min(1, "Добавьте хотя бы одно изображение")
    .max(20, "Максимум 20 изображений"),
  contactName: z.string().min(2, "Укажите ваше имя"),
  contactPhone: z
    .string()
    .regex(
      /^(\+7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/,
      "Некорректный номер телефона"
    ),
  isPremium: z.boolean().default(false),
});

export type CreatePropertyFormData = z.infer<typeof createPropertySchema>;

/**
 * Схема валидации для поиска
 */
export const searchSchema = z.object({
  query: z.string().optional(),
  type: z.enum(["apartment", "house", "land", "commercial"]).optional(),
  priceMin: z.number().min(0).optional().nullable(),
  priceMax: z.number().min(0).optional().nullable(),
  rooms: z.number().min(0).optional().nullable(),
  areaMin: z.number().min(0).optional().nullable(),
  region: z.enum(["Chechnya", "Ingushetia", "Other"]).optional(),
  sortBy: z
    .enum(["price-asc", "price-desc", "date-desc", "relevance"])
    .default("relevance"),
});

export type SearchFormData = z.infer<typeof searchSchema>;

/**
 * Схема валидации для контактной формы
 */
export const contactSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  email: z.string().email("Некорректный email адрес"),
  phone: z
    .string()
    .regex(
      /^(\+7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/,
      "Некорректный номер телефона"
    )
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .min(10, "Сообщение должно содержать минимум 10 символов")
    .max(1000, "Сообщение слишком длинное"),
});

export type ContactFormData = z.infer<typeof contactSchema>;
