import { Container } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, AlertCircle, Shield, Ban } from "lucide-react";

export default function RulesPage() {
  return (
    <Container size='lg' className='py-6 sm:py-8 md:py-12'>
      <div className='space-y-6 sm:space-y-8'>
        <div className='text-center space-y-3 sm:space-y-4'>
          <h1 className='text-3xl sm:text-4xl font-bold text-foreground'>
            Правила использования
          </h1>
          <p className='text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2'>
            Правила и требования для пользователей платформы Дохкар
          </p>
        </div>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl sm:text-2xl'>
              <FileText className='w-6 h-6 text-primary' />
              Общие правила
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <p className='text-sm sm:text-base text-foreground leading-relaxed mb-4'>
                Используя платформу Дохкар, вы соглашаетесь соблюдать следующие правила и
                требования. Нарушение правил может привести к блокировке аккаунта и
                удалению объявлений.
              </p>
            </div>
            <div className='space-y-3'>
              <div>
                <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                  1. Точность информации
                </p>
                <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                  Все объявления должны содержать достоверную информацию о недвижимости.
                  Запрещается размещение ложных или вводящих в заблуждение данных.
                </p>
              </div>
              <div>
                <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                  2. Качество фотографий
                </p>
                <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                  Фотографии должны быть четкими и соответствовать реальному состоянию
                  недвижимости. Запрещается использование чужих фотографий или изображений
                  из интернета.
                </p>
              </div>
              <div>
                <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                  3. Контактная информация
                </p>
                <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                  Указывайте актуальные контактные данные. Не размещайте чужие телефоны
                  или email без разрешения владельца.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl sm:text-2xl'>
              <Shield className='w-6 h-6 text-primary' />
              Запрещенные действия
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex gap-3'>
              <Ban className='w-5 h-5 text-destructive shrink-0 mt-0.5' />
              <p className='text-sm sm:text-base text-foreground'>
                Размещение объявлений о несуществующей недвижимости
              </p>
            </div>
            <div className='flex gap-3'>
              <Ban className='w-5 h-5 text-destructive shrink-0 mt-0.5' />
              <p className='text-sm sm:text-base text-foreground'>
                Использование чужих фотографий или описаний
              </p>
            </div>
            <div className='flex gap-3'>
              <Ban className='w-5 h-5 text-destructive shrink-0 mt-0.5' />
              <p className='text-sm sm:text-base text-foreground'>
                Мошенничество или попытки обмана пользователей
              </p>
            </div>
            <div className='flex gap-3'>
              <Ban className='w-5 h-5 text-destructive shrink-0 mt-0.5' />
              <p className='text-sm sm:text-base text-foreground'>
                Размещение оскорбительного или нецензурного контента
              </p>
            </div>
            <div className='flex gap-3'>
              <Ban className='w-5 h-5 text-destructive shrink-0 mt-0.5' />
              <p className='text-sm sm:text-base text-foreground'>
                Спам, массовая рассылка или навязчивая реклама
              </p>
            </div>
            <div className='flex gap-3'>
              <Ban className='w-5 h-5 text-destructive shrink-0 mt-0.5' />
              <p className='text-sm sm:text-base text-foreground'>
                Нарушение авторских прав или интеллектуальной собственности
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl sm:text-2xl'>
              <AlertCircle className='w-6 h-6 text-primary' />
              Ответственность пользователей
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                Проверка документов
              </p>
              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                Покупатели обязаны самостоятельно проверять документы на недвижимость
                перед совершением сделки. Платформа Дохкар не несет ответственности за
                подлинность документов и правовую чистоту сделок.
              </p>
            </div>
            <div>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                Безопасность сделок
              </p>
              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                Все сделки совершаются напрямую между покупателем и продавцом. Платформа
                предоставляет только информационную площадку и не участвует в финансовых
                операциях между сторонами.
              </p>
            </div>
            <div>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                Модерация контента
              </p>
              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                Администрация оставляет за собой право модерировать, редактировать или
                удалять объявления, которые нарушают правила платформы, без
                предварительного уведомления.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className='border-primary/20'>
          <CardHeader>
            <CardTitle className='text-lg sm:text-xl'>Нарушение правил</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm sm:text-base text-foreground leading-relaxed mb-4'>
              При нарушении правил платформы администрация может:
            </p>
            <ul className='space-y-2 text-sm sm:text-base text-muted-foreground list-disc list-inside ml-2'>
              <li>Удалить объявление без возврата средств</li>
              <li>Временно или permanently заблокировать аккаунт</li>
              <li>Ограничить доступ к функциям платформы</li>
              <li>
                Передать информацию в правоохранительные органы при подозрении в
                мошенничестве
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className='border-primary/20 bg-muted/30'>
          <CardContent className='pt-6'>
            <p className='text-sm sm:text-base text-center text-muted-foreground'>
              Если вы заметили нарушение правил, сообщите нам:{" "}
              <a
                href='mailto:support@dohkar.ru'
                className='text-primary hover:underline font-medium'
              >
                support@dohkar.ru
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
