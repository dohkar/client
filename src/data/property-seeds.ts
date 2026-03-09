/**
 * Seed данные для свойств (properties)
 *
 * Изображения взяты из бесплатных источников:
 * - Unsplash (https://unsplash.com/)
 * - Pexels (https://www.pexels.com/)
 *
 * Эти изображения можно легально использовать для разработки и тестирования.
 */

import type { Property } from "@/types/property";

export const PROPERTY_SEEDS: Property[] = [
  // ==================== КВАРТИРЫ (APARTMENTS) ====================
  {
    id: "seed-1",
    slug: "3-k-kvartira-evroremont-grozny",
    title: "3-к квартира с евроремонтом в центре Грозного",
    price: 8500000,
    currency: "RUB",
    location: "Грозный, пр. Путина, 12",
    region: "Chechnya",
    type: "apartment",
    dealType: "SALE",
    rooms: 3,
    area: 85,
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    isPremium: true,
    datePosted: "2024-01-15",
    description:
      "Просторная квартира с дизайнерским ремонтом в центре города. Панорамный вид на город и мечеть. Качественные материалы, теплые полы, кондиционеры.",
    features: [
      "Евроремонт",
      "Кондиционер",
      "Парковка",
      "Лифт",
      "Балкон",
      "Видеонаблюдение",
    ],
    contact: {
      name: "Магомед",
      phone: "+7 (928) 000-00-01",
    },
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?w=800&h=600&fit=crop",
    ],
    pricePerMeter: 100000,
    floor: 5,
    totalFloors: 9,
    views: 1240,
    favoritesCount: 12,
    status: "active",
    userId: "user-seed-1",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "seed-2",
    slug: "2-k-kvartira-novostroyka-argun",
    title: "2-к квартира в новом доме, Аргун",
    price: 4200000,
    currency: "RUB",
    location: "Аргун, ул. Кадырова, 45",
    region: "Chechnya",
    type: "apartment",
    dealType: "SALE",
    rooms: 2,
    area: 54,
    image:
      "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?w=800&h=600&fit=crop",
    isPremium: false,
    datePosted: "2024-01-18",
    description:
      "Светлая квартира в современном жилом комплексе. Закрытый двор, детская площадка, паркинг. Рядом школа и мечеть.",
    features: ["Новостройка", "Балкон", "Парковка", "Детская площадка", "Закрытый двор"],
    contact: {
      name: "Фатима",
      phone: "+7 (928) 000-00-04",
    },
    images: [
      "https://images.unsplash.com/photo-1484154218962-a1c002085d2f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&h=600&fit=crop",
    ],
    pricePerMeter: 77778,
    floor: 3,
    totalFloors: 5,
    views: 678,
    favoritesCount: 5,
    status: "active",
    userId: "user-seed-2",
    createdAt: "2024-01-18T09:00:00Z",
    updatedAt: "2024-01-19T11:00:00Z",
  },
  {
    id: "seed-3",
    slug: "1-k-kvartira-minutka-grozny",
    title: "1-к квартира, район Минутка",
    price: 3800000,
    currency: "RUB",
    location: "Грозный, пл. Минутка",
    region: "Chechnya",
    type: "apartment",
    dealType: "SALE",
    rooms: 1,
    area: 42,
    image:
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop",
    isPremium: false,
    datePosted: "2024-01-20",
    description:
      "Уютная студия с современным ремонтом. Вся мебель и техника остаются. Отличная транспортная развязка.",
    features: ["Мебель", "Техника", "Ремонт", "Транспорт"],
    contact: {
      name: "Зарема",
      phone: "+7 (928) 000-00-06",
    },
    images: [
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    ],
    pricePerMeter: 90476,
    floor: 7,
    totalFloors: 12,
    views: 567,
    favoritesCount: 8,
    status: "active",
    userId: "user-seed-3",
    createdAt: "2024-01-20T08:00:00Z",
    updatedAt: "2024-01-20T09:00:00Z",
  },
  {
    id: "seed-4",
    slug: "4-k-kvartira-luxury-grozny",
    title: "4-к квартира премиум-класса, Грозный",
    price: 15000000,
    currency: "RUB",
    location: "Грозный, пр. Путина, 25",
    region: "Chechnya",
    type: "apartment",
    dealType: "SALE",
    rooms: 4,
    area: 150,
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    isPremium: true,
    datePosted: "2024-01-10",
    description:
      "Элитная квартира с панорамными окнами и видом на мечеть. Итальянская мебель, техника Miele, умный дом.",
    features: [
      "Премиум",
      "Панорамные окна",
      "Умный дом",
      "Паркинг",
      "Консьерж",
      "Вид на мечеть",
    ],
    contact: {
      name: "Ахмед",
      phone: "+7 (928) 000-00-10",
    },
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop",
    ],
    pricePerMeter: 100000,
    floor: 8,
    totalFloors: 10,
    views: 2340,
    favoritesCount: 25,
    status: "active",
    userId: "user-seed-4",
    createdAt: "2024-01-10T12:00:00Z",
    updatedAt: "2024-01-21T16:00:00Z",
  },

  // ==================== ДОМА (HOUSES) ====================
  {
    id: "seed-5",
    slug: "dom-2-etazha-nazran",
    title: "2-этажный кирпичный дом в Назрани",
    price: 12000000,
    currency: "RUB",
    location: "Назрань, ул. Муталиева, 78",
    region: "Ingushetia",
    type: "house",
    dealType: "SALE",
    rooms: 5,
    area: 220,
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop",
    isPremium: true,
    datePosted: "2024-01-12",
    description:
      "Просторный дом для большой семьи. Большой двор, гараж на 2 машины, фруктовый сад. Все коммуникации центральные.",
    features: ["Гараж", "Сад", "Подвал", "Газ", "Вода", "Септик", "Забор"],
    contact: {
      name: "Ибрагим",
      phone: "+7 (928) 000-00-02",
    },
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1598228723793-52759bba239c?w=800&h=600&fit=crop",
    ],
    pricePerMeter: 54545,
    floor: 2,
    views: 890,
    favoritesCount: 15,
    status: "active",
    userId: "user-seed-5",
    createdAt: "2024-01-12T14:00:00Z",
    updatedAt: "2024-01-18T10:15:00Z",
  },
  {
    id: "seed-6",
    slug: "kottedzh-dzheyrah-gory",
    title: "Коттедж в горах, Джейрахский район",
    price: 15000000,
    currency: "RUB",
    location: "Джейрахский район, с. Армхи",
    region: "Ingushetia",
    type: "house",
    dealType: "SALE",
    rooms: 4,
    area: 150,
    image:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=600&fit=crop",
    isPremium: true,
    datePosted: "2024-01-08",
    description:
      "Уникальное предложение! Дом в живописном горном районе. Идеально для туристического бизнеса или семейного отдыха. Вид на горы.",
    features: ["Вид на горы", "Родник", "Туристическая зона", "Баня", "Беседка"],
    contact: {
      name: "Руслан",
      phone: "+7 (928) 000-00-05",
    },
    images: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1449156493391-d2cfa28e468b?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&h=600&fit=crop",
    ],
    pricePerMeter: 100000,
    floor: 2,
    views: 1234,
    favoritesCount: 20,
    status: "active",
    userId: "user-seed-6",
    createdAt: "2024-01-08T11:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z",
  },
  {
    id: "seed-7",
    slug: "dom-5-komnat-magas",
    title: "Дом 5 комнат в Магасе",
    price: 18000000,
    currency: "RUB",
    location: "Магас, 10-й микрорайон",
    region: "Ingushetia",
    type: "house",
    dealType: "SALE",
    rooms: 5,
    area: 280,
    image:
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=600&fit=crop",
    isPremium: true,
    datePosted: "2024-01-05",
    description:
      "Современный дом в столице Ингушетии. Дизайнерский ремонт, все коммуникации, landscaped двор. Рядом правительственные здания.",
    features: ["Дизайнерский ремонт", "Ландшафт", "Гараж", "Сигнализация", "Газон"],
    contact: {
      name: "Муса",
      phone: "+7 (928) 000-00-11",
    },
    images: [
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1605276374040-5623a22aa874?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1605276374040-5623a22aa874?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
    ],
    pricePerMeter: 64286,
    floor: 2,
    views: 1567,
    favoritesCount: 18,
    status: "active",
    userId: "user-seed-7",
    createdAt: "2024-01-05T10:00:00Z",
    updatedAt: "2024-01-20T14:00:00Z",
  },
  {
    id: "seed-8",
    slug: "chastny-dom-gudermes",
    title: "Частный дом в Гудермесе",
    price: 9500000,
    currency: "RUB",
    location: "Гудермес, ул. Имама Шамиля",
    region: "Chechnya",
    type: "house",
    dealType: "SALE",
    rooms: 4,
    area: 180,
    image:
      "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&h=600&fit=crop",
    isPremium: false,
    datePosted: "2024-01-14",
    description:
      "Добротный дом в спокойном районе. Тихие соседи, развитая инфраструктура. Школа и мечеть в шаговой доступности.",
    features: ["Газ", "Вода", "Свет", "Забор", "Ворота", "Сарай"],
    contact: {
      name: "Хасан",
      phone: "+7 (928) 000-00-12",
    },
    images: [
      "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop",
    ],
    pricePerMeter: 52778,
    floor: 1,
    views: 456,
    favoritesCount: 7,
    status: "active",
    userId: "user-seed-8",
    createdAt: "2024-01-14T13:00:00Z",
    updatedAt: "2024-01-19T15:30:00Z",
  },

  // ==================== ЗЕМЕЛЬНЫЕ УЧАСТКИ (LAND) ====================
  {
    id: "seed-9",
    slug: "uchastok-10-sotok-magas",
    title: "Участок 10 соток под ИЖС в Магасе",
    price: 3500000,
    currency: "RUB",
    location: "Магас, 8-й микрорайон",
    region: "Ingushetia",
    type: "land",
    dealType: "SALE",
    area: 1000,
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop",
    isPremium: false,
    datePosted: "2024-01-16",
    description:
      "Ровный участок правильной формы в перспективном районе. Все коммуникации по границе. Документы готовы.",
    features: ["ИЖС", "Свет", "Газ по меже", "Ровный", "Документы"],
    contact: {
      name: "Ахмед",
      phone: "+7 (928) 000-00-03",
    },
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1500076656116-558756c6b6f0?w=800&h=600&fit=crop",
    ],
    pricePerMeter: 3500,
    views: 456,
    favoritesCount: 9,
    status: "active",
    userId: "user-seed-9",
    createdAt: "2024-01-16T09:00:00Z",
    updatedAt: "2024-01-18T12:00:00Z",
  },
  {
    id: "seed-10",
    slug: "uchastok-15-sotok-chechnya",
    title: "Участок 15 соток, Чечен-Аул",
    price: 2800000,
    currency: "RUB",
    location: "Чечен-Аул, ул. Центральная",
    region: "Chechnya",
    type: "land",
    dealType: "SALE",
    area: 1500,
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=600&fit=crop",
    isPremium: false,
    datePosted: "2024-01-17",
    description:
      "Большой участок для строительства дома. Живописное место, чистый воздух. Рядом река и лес.",
    features: ["ИЖС", "Свет", "Вода", "Природа", "Лес рядом"],
    contact: {
      name: "Сулейман",
      phone: "+7 (928) 000-00-13",
    },
    images: [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop",
    ],
    pricePerMeter: 1867,
    views: 345,
    favoritesCount: 6,
    status: "active",
    userId: "user-seed-10",
    createdAt: "2024-01-17T10:00:00Z",
    updatedAt: "2024-01-20T08:00:00Z",
  },
  {
    id: "seed-11",
    slug: "uchastok-kommercheskiy-grozny",
    title: "Коммерческий участок 20 соток, Грозный",
    price: 12000000,
    currency: "RUB",
    location: "Грозный, пр. Мохаммеда Али",
    region: "Chechnya",
    type: "land",
    dealType: "SALE",
    area: 2000,
    image:
      "https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?w=800&h=600&fit=crop",
    isPremium: true,
    datePosted: "2024-01-11",
    description:
      "Участок под коммерческую застройку. Первая линия, высокий трафик. Подходит для ТЦ, офиса, автосалона.",
    features: ["Коммерция", "Первая линия", "Трафик", "Все коммуникации"],
    contact: {
      name: "Тимур",
      phone: "+7 (928) 000-00-14",
    },
    images: [
      "https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
    ],
    pricePerMeter: 6000,
    views: 789,
    favoritesCount: 11,
    status: "active",
    userId: "user-seed-11",
    createdAt: "2024-01-11T11:00:00Z",
    updatedAt: "2024-01-19T16:00:00Z",
  },

  // ==================== КОММЕРЧЕСКАЯ НЕДВИЖИМОСТЬ (COMMERCIAL) ====================
  {
    id: "seed-12",
    slug: "ofis-center-grozny",
    title: "Офисное помещение в центре Грозного",
    price: 25000000,
    currency: "RUB",
    location: "Грозный, пр. Путина, 15",
    region: "Chechnya",
    type: "commercial",
    dealType: "SALE",
    area: 120,
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
    isPremium: true,
    datePosted: "2024-01-09",
    description:
      "Офис класса А в бизнес-центре. Ремонт, мебель, техника. Конференц-зал, кухня, парковка. Охрана 24/7.",
    features: ["Офис", "Бизнес-центр", "Мебель", "Парковка", "Охрана", "Кондиционеры"],
    contact: {
      name: "Бизнес-Центр",
      phone: "+7 (928) 000-00-15",
    },
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop",
    ],
    pricePerMeter: 208333,
    floor: 4,
    totalFloors: 6,
    views: 567,
    favoritesCount: 8,
    status: "active",
    userId: "user-seed-12",
    createdAt: "2024-01-09T09:00:00Z",
    updatedAt: "2024-01-17T11:00:00Z",
  },
  {
    id: "seed-13",
    slug: "magazin-torgovaya-ploshchad",
    title: "Торговое помещение 80 м²",
    price: 8000000,
    currency: "RUB",
    location: "Назрань, пр. Базоркина",
    region: "Ingushetia",
    type: "commercial",
    dealType: "SALE",
    area: 80,
    image:
      "https://images.unsplash.com/photo-1567449303479-1070951e7254?w=800&h=600&fit=crop",
    isPremium: false,
    datePosted: "2024-01-13",
    description:
      "Готовый бизнес в проходном месте. Витринные окна, отдельный вход. Подходит под магазин, салон, кафе.",
    features: ["Витрина", "Вход с улицы", "Парковка", "Ремонт"],
    contact: {
      name: "Елена",
      phone: "+7 (928) 000-00-16",
    },
    images: [
      "https://images.unsplash.com/photo-1567449303479-1070951e7254?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1528696892704-5e11528b1509?w=800&h=600&fit=crop",
    ],
    pricePerMeter: 100000,
    floor: 1,
    totalFloors: 2,
    views: 432,
    favoritesCount: 5,
    status: "active",
    userId: "user-seed-13",
    createdAt: "2024-01-13T14:00:00Z",
    updatedAt: "2024-01-18T09:00:00Z",
  },

  // ==================== АРЕНДА (RENT) ====================
  {
    id: "seed-14",
    slug: "kvartira-arenda-grozny",
    title: "2-к квартира посуточно, Грозный",
    price: 5000,
    currency: "RUB",
    location: "Грозный, ул. Грозненацкая",
    region: "Chechnya",
    type: "apartment",
    dealType: "RENT_OUT",
    rooms: 2,
    area: 60,
    image:
      "https://images.unsplash.com/photo-1522771753035-1a5b6562f3ba?w=800&h=600&fit=crop",
    isPremium: false,
    datePosted: "2024-01-19",
    description:
      "Уютная квартира для посуточной аренды. Все удобства, Wi-Fi, ТВ, стиральная машина. Отчетные документы.",
    features: ["Wi-Fi", "ТВ", "Стиральная машина", "Кухня", "Кондиционер"],
    contact: {
      name: "Айшат",
      phone: "+7 (928) 000-00-17",
    },
    images: [
      "https://images.unsplash.com/photo-1522771753035-1a5b6562f3ba?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop",
    ],
    pricePerMeter: 83,
    floor: 3,
    totalFloors: 5,
    views: 234,
    favoritesCount: 4,
    status: "active",
    userId: "user-seed-14",
    createdAt: "2024-01-19T10:00:00Z",
    updatedAt: "2024-01-20T12:00:00Z",
  },
  {
    id: "seed-15",
    slug: "dom-arenda-dzheyrah",
    title: "Дом для отдыха в горах (посуточно)",
    price: 15000,
    currency: "RUB",
    location: "Джейрахский район",
    region: "Ingushetia",
    type: "house",
    dealType: "RENT_OUT",
    rooms: 3,
    area: 100,
    image:
      "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&h=600&fit=crop",
    isPremium: true,
    datePosted: "2024-01-07",
    description:
      "Гостевой дом для семейного отдыха. Потрясающие виды, баня, мангал. Идеально для выходных.",
    features: ["Баня", "Мангал", "Вид на горы", "Парковка", "Wi-Fi"],
    contact: {
      name: "Гостевой Дом",
      phone: "+7 (928) 000-00-18",
    },
    images: [
      "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&h=600&fit=crop",
    ],
    pricePerMeter: 150,
    floor: 1,
    views: 890,
    favoritesCount: 22,
    status: "active",
    userId: "user-seed-15",
    createdAt: "2024-01-07T08:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z",
  },
];

/**
 * Helper function to get a random property from seeds
 */
export function getRandomPropertySeed(): Property {
  return PROPERTY_SEEDS[Math.floor(Math.random() * PROPERTY_SEEDS.length)];
}

/**
 * Helper function to get properties by type
 */
export function getPropertySeedsByType(type: Property["type"]): Property[] {
  return PROPERTY_SEEDS.filter((p) => p.type === type);
}

/**
 * Helper function to get properties by region
 */
export function getPropertySeedsByRegion(region: Property["region"]): Property[] {
  return PROPERTY_SEEDS.filter((p) => p.region === region);
}

/**
 * Helper function to get properties by deal type
 */
export function getPropertySeedsByDealType(dealType: Property["dealType"]): Property[] {
  return PROPERTY_SEEDS.filter((p) => p.dealType === dealType);
}
