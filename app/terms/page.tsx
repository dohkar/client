import { Container } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Scale, AlertTriangle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <Container size='lg' className='py-6 sm:py-8 md:py-12'>
      <div className='space-y-6 sm:space-y-8'>
        <div className='text-center space-y-3 sm:space-y-4'>
          <h1 className='text-3xl sm:text-4xl font-bold text-foreground'>
            Условия использования
          </h1>
          <p className='text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2'>
            Правовые условия использования платформы Дохкар
          </p>
        </div>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl sm:text-2xl'>
              <FileText className='w-6 h-6 text-primary' />
              Принятие условий
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-sm sm:text-base text-foreground leading-relaxed'>
              Используя платформу Дохкар, вы подтверждаете, что прочитали, поняли и
              соглашаетесь соблюдать настоящие Условия использования. Если вы не согласны
              с какими-либо условиями, пожалуйста, не используйте наш сервис.
            </p>
            <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
              Мы оставляем за собой право изменять, дополнять или удалять любые положения
              настоящих Условий в любое время. Продолжение использования сервиса после
              внесения изменений означает ваше согласие с обновленными условиями.
            </p>
          </CardContent>
        </Card>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl sm:text-2xl'>
              <Scale className='w-6 h-6 text-primary' />
              Описание сервиса
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <p className='text-sm sm:text-base text-foreground leading-relaxed mb-3'>
                Дохкар — это информационная платформа для размещения объявлений о
                недвижимости на Кавказе. Мы предоставляем техническую площадку для связи
                между продавцами и покупателями недвижимости.
              </p>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                Важно понимать:
              </p>
              <ul className='space-y-2 text-sm sm:text-base text-muted-foreground list-disc list-inside ml-2'>
                <li>Мы не являемся участником сделок между пользователями</li>
                <li>Мы не гарантируем подлинность информации в объявлениях</li>
                <li>Мы не несем ответственности за результаты сделок</li>
                <li>Все сделки совершаются напрямую между пользователями</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl sm:text-2xl'>
              <CheckCircle2 className='w-6 h-6 text-primary' />
              Обязанности пользователей
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                При использовании сервиса вы обязуетесь:
              </p>
              <ul className='space-y-2 text-sm sm:text-base text-muted-foreground list-disc list-inside ml-2'>
                <li>Предоставлять достоверную и актуальную информацию</li>
                <li>Соблюдать действующее законодательство Российской Федерации</li>
                <li>
                  Не размещать незаконный, оскорбительный или вводящий в заблуждение
                  контент
                </li>
                <li>
                  Не использовать сервис для мошенничества или обмана других пользователей
                </li>
                <li>Не нарушать права интеллектуальной собственности третьих лиц</li>
                <li>Не пытаться получить несанкционированный доступ к системе</li>
                <li>Не передавать свой аккаунт третьим лицам</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl sm:text-2xl'>
              <AlertTriangle className='w-6 h-6 text-primary' />
              Ограничение ответственности
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                Платформа предоставляется как есть
              </p>
              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                Мы не гарантируем, что сервис будет работать без перерывов, ошибок или
                сбоев. Мы не несем ответственности за любые убытки, возникшие в результате
                использования или невозможности использования сервиса.
              </p>
            </div>
            <div>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                Информация в объявлениях
              </p>
              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                Мы не проверяем и не гарантируем достоверность информации, размещенной
                пользователями в объявлениях. Покупатели несут полную ответственность за
                проверку информации и документов перед совершением сделки.
              </p>
            </div>
            <div>
              <p className='text-sm sm:text-base font-semibold text-foreground mb-2'>
                Сделки между пользователями
              </p>
              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                Мы не участвуем в сделках между пользователями и не несем ответственности
                за их результаты. Все финансовые операции и юридические вопросы решаются
                напрямую между сторонами сделки.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='text-xl sm:text-2xl'>
              Интеллектуальная собственность
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <p className='text-sm sm:text-base text-foreground leading-relaxed mb-3'>
                Все материалы платформы, включая дизайн, логотипы, тексты, графику и
                программное обеспечение, являются собственностью Дохкар или используются
                по лицензии и защищены законами об интеллектуальной собственности.
              </p>
              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                Размещая контент на платформе, вы предоставляете нам неисключительную
                лицензию на использование, отображение и распространение этого контента в
                рамках работы сервиса.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='text-xl sm:text-2xl'>Прекращение доступа</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm sm:text-base text-foreground leading-relaxed'>
              Мы оставляем за собой право в любое время, по нашему усмотрению,
              приостановить или прекратить доступ к сервису для любого пользователя,
              который нарушает настоящие Условия использования, без предварительного
              уведомления и без возмещения каких-либо убытков.
            </p>
          </CardContent>
        </Card>

        <Card className='shadow-lg border-primary/20'>
          <CardHeader>
            <CardTitle className='text-xl sm:text-2xl'>Применимое право</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm sm:text-base text-foreground leading-relaxed'>
              Настоящие Условия использования регулируются законодательством Российской
              Федерации. Любые споры, возникающие в связи с использованием сервиса,
              подлежат разрешению в соответствии с законодательством РФ.
            </p>
          </CardContent>
        </Card>

        <Card className='border-primary/20 bg-muted/30'>
          <CardContent className='pt-6'>
            <p className='text-sm sm:text-base text-center text-muted-foreground'>
              По вопросам условий использования обращайтесь:{" "}
              <a
                href='mailto:support@dohkar.ru'
                className='text-primary hover:underline font-medium'
              >
                support@dohkar.ru
              </a>
            </p>
            <p className='text-xs text-center text-muted-foreground mt-2'>
              Последнее обновление:{" "}
              {new Date().toLocaleDateString("ru-RU", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
