import { Container } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, FileCheck } from "lucide-react";

export default function PrivacyPage() {
  // Генерируем дату на сервере один раз
  const lastUpdated = "29 января 2026 г.";

  return (
    <Container size='lg' className='py-6 sm:py-8 md:py-12'>
      <div className='space-y-6 sm:space-y-8'>
        <div className='text-center space-y-3 sm:space-y-4'>
          <h1 className='text-3xl sm:text-4xl font-bold text-foreground'>
            Политика конфиденциальности
          </h1>
          <p className='text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2'>
            Как мы собираем, используем и защищаем ваши персональные данные
          </p>
        </div>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl sm:text-2xl'>
              <Shield className='w-6 h-6 text-primary' />
              Общие положения
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-sm sm:text-base text-foreground leading-relaxed'>
              Платформа Дохкар (&quot;мы&quot;, &quot;наш&quot;, &quot;нас&quot;)
              обязуется защищать конфиденциальность пользователей. Настоящая Политика
              конфиденциальности описывает, как мы собираем, используем, храним и защищаем
              ваши персональные данные при использовании нашего сервиса.
            </p>
            <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
              Используя наш сервис, вы соглашаетесь с условиями настоящей Политики
              конфиденциальности. Если вы не согласны с какими-либо условиями, пожалуйста,
              не используйте наш сервис.
            </p>
          </CardContent>
        </Card>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl sm:text-2xl'>
              <Eye className='w-6 h-6 text-primary' />
              Какие данные мы собираем
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                Персональные данные
              </p>
              <ul className='list-disc list-inside space-y-1 text-sm sm:text-base text-muted-foreground ml-2'>
                <li>Имя и фамилия</li>
                <li>Email адрес</li>
                <li>Номер телефона</li>
                <li>Адрес (при указании в объявлении)</li>
              </ul>
            </div>
            <div>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                Технические данные
              </p>
              <ul className='list-disc list-inside space-y-1 text-sm sm:text-base text-muted-foreground ml-2'>
                <li>IP-адрес</li>
                <li>Тип браузера и операционной системы</li>
                <li>Информация об устройстве</li>
                <li>Данные о посещенных страницах</li>
                <li>Cookies и аналогичные технологии</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl sm:text-2xl'>
              <FileCheck className='w-6 h-6 text-primary' />
              Как мы используем ваши данные
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div>
              <p className='text-sm sm:text-base text-foreground leading-relaxed'>
                Мы используем собранные данные для следующих целей:
              </p>
            </div>
            <ul className='space-y-2 text-sm sm:text-base text-muted-foreground list-disc list-inside ml-2'>
              <li>Предоставление и улучшение наших услуг</li>
              <li>Обработка ваших запросов и объявлений</li>
              <li>Связь с вами по вопросам использования сервиса</li>
              <li>Обеспечение безопасности платформы</li>
              <li>Соблюдение требований законодательства</li>
              <li>Персонализация контента и рекламы</li>
              <li>Анализ использования сервиса для улучшения функциональности</li>
            </ul>
          </CardContent>
        </Card>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl sm:text-2xl'>
              <Lock className='w-6 h-6 text-primary' />
              Защита данных
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                Меры безопасности
              </p>
              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed mb-3'>
                Мы применяем современные технологии и методы для защиты ваших персональных
                данных:
              </p>
              <ul className='list-disc list-inside space-y-1 text-sm sm:text-base text-muted-foreground ml-2'>
                <li>Шифрование данных при передаче (SSL/TLS)</li>
                <li>Безопасное хранение данных на защищенных серверах</li>
                <li>Ограничение доступа к персональным данным</li>
                <li>Регулярное обновление систем безопасности</li>
                <li>Мониторинг и предотвращение несанкционированного доступа</li>
              </ul>
            </div>
            <div>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                Передача данных третьим лицам
              </p>
              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                Мы не продаем и не передаем ваши персональные данные третьим лицам, за
                исключением случаев, когда это необходимо для предоставления услуг,
                требуется по закону, или вы дали на это явное согласие.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='text-xl sm:text-2xl'>Ваши права</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <p className='text-sm sm:text-base text-foreground leading-relaxed mb-3'>
              Вы имеете право:
            </p>
            <ul className='space-y-2 text-sm sm:text-base text-muted-foreground list-disc list-inside ml-2'>
              <li>Получать информацию о том, какие данные мы храним о вас</li>
              <li>Исправлять неточные или неполные данные</li>
              <li>Удалять ваши персональные данные</li>
              <li>Ограничивать обработку ваших данных</li>
              <li>Отозвать согласие на обработку данных</li>
              <li>Подать жалобу в надзорный орган</li>
            </ul>
          </CardContent>
        </Card>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='text-xl sm:text-2xl'>Cookies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm sm:text-base text-foreground leading-relaxed'>
              Мы используем cookies и аналогичные технологии для улучшения работы сайта,
              персонализации контента и анализа трафика. Вы можете управлять настройками
              cookies в вашем браузере, однако это может повлиять на функциональность
              сайта.
            </p>
          </CardContent>
        </Card>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='text-xl sm:text-2xl'>Изменения в политике</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm sm:text-base text-foreground leading-relaxed'>
              Мы можем периодически обновлять настоящую Политику конфиденциальности. О
              существенных изменениях мы уведомим вас через сайт или по email. Продолжение
              использования сервиса после внесения изменений означает ваше согласие с
              обновленной политикой.
            </p>
          </CardContent>
        </Card>

        <Card className='border-primary/20 bg-muted/30'>
          <CardContent className='pt-6'>
            <p className='text-sm sm:text-base text-center text-muted-foreground'>
              По вопросам конфиденциальности обращайтесь:{" "}
              <a
                href='mailto:support@dohkar.ru'
                className='text-primary hover:underline font-medium'
              >
                support@dohkar.ru
              </a>
            </p>
            <p className='text-xs text-center text-muted-foreground mt-2'>
              Последнее обновление: {lastUpdated}
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
