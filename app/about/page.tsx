import { Container } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <Container size='lg' className='py-6 sm:py-8 md:py-12'>
      <div className='space-y-6 sm:space-y-8'>
        <div className='text-center space-y-3 sm:space-y-4'>
          <h1 className='text-3xl sm:text-4xl font-bold text-foreground'>О проекте</h1>
          <p className='text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2'>
            Информация о проекте Дохкар и его возможностях
          </p>
        </div>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='text-xl sm:text-2xl'>О проекте Дохкар</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-sm sm:text-base text-foreground leading-relaxed'>
              Дохкар - это современная платформа для поиска и продажи недвижимости на
              Кавказе. Мы объединяем продавцов и покупателей, делая процесс поиска
              недвижимости простым и безопасным.
            </p>
            <p className='text-sm sm:text-base font-semibold text-foreground'>
              Наши преимущества:
            </p>
            <ul className='list-disc list-inside space-y-2 text-sm sm:text-base text-foreground ml-2'>
              <li>Тысячи проверенных объявлений</li>
              <li>Удобный поиск с фильтрами</li>
              <li>Безопасные сделки</li>
              <li>Премиум размещение</li>
              <li>Поддержка 24/7</li>
              <li>Мобильное приложение</li>
            </ul>
          </CardContent>
        </Card>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
          <Card className='border-primary/20 hover:shadow-lg transition-shadow'>
            <CardHeader>
              <CardTitle className='text-lg sm:text-xl'>🎯 Наша миссия</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm sm:text-base text-foreground leading-relaxed'>
                Помочь каждому найти свой идеальный дом на Кавказе, создавая удобную и
                надежную платформу для покупки и продажи недвижимости.
              </p>
            </CardContent>
          </Card>

          <Card className='border-primary/20 hover:shadow-lg transition-shadow'>
            <CardHeader>
              <CardTitle className='text-lg sm:text-xl'>✨ Особенности</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm sm:text-base text-foreground leading-relaxed'>
                Современный интерфейс, быстрый поиск, детальные фильтры, фото галереи,
                безопасные сделки и профессиональная поддержка.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
