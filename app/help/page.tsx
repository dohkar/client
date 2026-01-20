import { Container } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HelpCircle, Search, MessageSquare, Shield, CreditCard } from "lucide-react";

export default function HelpPage() {
  return (
    <Container size='lg' className='py-6 sm:py-8 md:py-12'>
      <div className='space-y-6 sm:space-y-8'>
        <div className='text-center space-y-3 sm:space-y-4'>
          <h1 className='text-3xl sm:text-4xl font-bold text-foreground'>Помощь</h1>
          <p className='text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2'>
            Часто задаваемые вопросы и полезная информация
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
          <Card className="border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Search className="w-5 h-5 text-primary" />
                Поиск недвижимости
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                  Как найти подходящую недвижимость?
                </p>
                <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                  Используйте фильтры на странице поиска: укажите тип недвижимости, цену, площадь,
                  район и другие параметры. Вы можете сохранить интересные объявления в избранное.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CreditCard className="w-5 h-5 text-primary" />
                Размещение объявлений
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                  Как разместить объявление?
                </p>
                <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                  Зарегистрируйтесь на сайте, перейдите в раздел &quot;Продать&quot; и заполните форму.
                  Первое объявление размещается бесплатно. Вы можете загрузить до 20 фотографий.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Shield className="w-5 h-5 text-primary" />
                Безопасность
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                  Как обезопасить сделку?
                </p>
                <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                  Всегда проверяйте документы на недвижимость, встречайтесь лично с продавцом,
                  не переводите деньги до подписания документов. При необходимости обращайтесь
                  к юристам для проверки сделки.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MessageSquare className="w-5 h-5 text-primary" />
                Связь с продавцом
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                  Как связаться с продавцом?
                </p>
                <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                  На странице объявления вы найдете контактную информацию продавца: телефон и email.
                  Вы также можете отправить сообщение через внутреннюю систему сообщений.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <HelpCircle className="w-6 h-6 text-primary" />
              Часто задаваемые вопросы
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                Сколько стоит размещение объявления?
              </p>
              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                Первое объявление размещается бесплатно. Премиум размещение с дополнительными
                возможностями продвижения доступно от 500₽ в месяц.
              </p>
            </div>

            <div>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                Можно ли редактировать объявление после публикации?
              </p>
              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                Да, вы можете редактировать свои объявления в любое время в разделе &quot;Мои объявления&quot;
                в личном кабинете.
              </p>
            </div>

            <div>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                Как удалить объявление?
              </p>
              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                В разделе &quot;Мои объявления&quot; нажмите на кнопку &quot;Удалить&quot; рядом с нужным объявлением.
                После подтверждения объявление будет удалено.
              </p>
            </div>

            <div>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                Что делать, если нашел ошибку в объявлении?
              </p>
              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                Сообщите нам об ошибке через форму обратной связи или напишите на
                support@dohkar.ru. Мы проверим информацию и при необходимости исправим.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Нужна дополнительная помощь?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm sm:text-base text-foreground leading-relaxed mb-4'>
              Если вы не нашли ответ на свой вопрос, свяжитесь с нашей службой поддержки:
            </p>
            <div className='space-y-2 text-sm sm:text-base'>
              <p>
                <span className='font-semibold'>Email:</span>{" "}
                <a href='mailto:support@dohkar.ru' className='text-primary hover:underline'>
                  support@dohkar.ru
                </a>
              </p>
              <p>
                <span className='font-semibold'>Телефон:</span>{" "}
                <a href='tel:+79990000000' className='text-primary hover:underline'>
                  +7 (999) 000-00-00
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
