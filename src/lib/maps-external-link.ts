/** Ссылка на точку во внешних картах (без встраиваемого API). */
export function yandexMapsPointUrl(lng: number, lat: number, z = 17): string {
  return `https://yandex.ru/maps/?pt=${lng},${lat}&z=${z}`;
}
