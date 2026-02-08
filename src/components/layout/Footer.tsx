import Link from "next/link";
import { ROUTES } from "@/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-muted/30 border-t'>
      <div className='container mx-auto px-4 py-8 sm:py-12'>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8'>
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <span className='font-bold text-lg sm:text-xl text-primary'>Дохкар</span>
            </div>
            <p className='text-sm text-muted-foreground leading-relaxed'>
              Удобный сервис для поиска и продажи недвижимости на Кавказе. Надежность,
              простота и уважение к традициям.
            </p>
          </div>

          <div>
            <h3 className='font-semibold mb-4 text-foreground'>Недвижимость</h3>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <Link
                  href={`${ROUTES.search}?type=apartment`}
                  className='hover:text-primary transition-colors'
                >
                  Квартиры
                </Link>
              </li>
              <li>
                <Link
                  href={`${ROUTES.search}?type=house`}
                  className='hover:text-primary transition-colors'
                >
                  Дома
                </Link>
              </li>
              <li>
                <Link
                  href={`${ROUTES.search}?type=land`}
                  className='hover:text-primary transition-colors'
                >
                  Земельные участки
                </Link>
              </li>
              <li>
                <Link
                  href={`${ROUTES.search}?type=commercial`}
                  className='hover:text-primary transition-colors'
                >
                  Коммерческая
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='font-semibold mb-4 text-foreground'>Пользователям</h3>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <Link
                  href={ROUTES.about}
                  className='hover:text-primary transition-colors'
                >
                  О сервисе
                </Link>
              </li>
              <li>
                <Link href={ROUTES.help} className='hover:text-primary transition-colors'>
                  Помощь
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.premium}
                  className='hover:text-primary transition-colors'
                >
                  Премиум размещение
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.rules}
                  className='hover:text-primary transition-colors'
                >
                  Правила
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='font-semibold mb-4 text-foreground'>Контакты</h3>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>support@dohkar.ru</li>
              <li>+7 (964) 026-00-62</li>
              <li className='pt-2'>
                <span className='block text-xs text-muted-foreground/70'>
                  Магас, пр. Борова 2
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className='border-t mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-muted-foreground'>
          <p>© {currentYear} Дохкар. Все права защищены.</p>
          <div className='flex flex-wrap justify-center gap-4 sm:gap-6'>
            <Link href={ROUTES.privacy} className='hover:text-primary transition-colors'>
              Конфиденциальность
            </Link>
            <Link href={ROUTES.terms} className='hover:text-primary transition-colors'>
              Условия использования
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
