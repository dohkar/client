import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Алиев Магомед",
    role: "Продавец, Грозный",
    content: "Благодаря платформе продал квартиру за 3 дня. Очень удобно и быстро!",
    rating: 5,
    avatar: "АМ",
  },
  {
    id: 2,
    name: "Мариям Ибрагимова",
    role: "Покупатель, Магас",
    content:
      "Искала дом в Магасе почти 2 месяца. Здесь нашла идеальный вариант за неделю.",
    rating: 5,
    avatar: "МИ",
  },
  {
    id: 3,
    name: "Рауф Хасаев",
    role: "Агент, Назрань",
    content: "Работаю на платформе полгода. Премиум подписка окупилась сразу же.",
    rating: 5,
    avatar: "РХ",
  },
];

export function Testimonials() {
  return (
    <section className='py-12 sm:py-16 md:py-20 bg-muted/30'>
      <div className='container mx-auto px-4'>
        <div className='max-w-3xl mx-auto text-center mb-8 sm:mb-12'>
          <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4'>
            Отзывы наших пользователей
          </h2>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto'>
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className='border-primary/20 bg-card hover:shadow-xl transition-all hover:-translate-y-1'
            >
              <CardContent className='p-5 sm:p-6'>
                <div className='flex gap-1 mb-4'>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className='w-4 h-4 fill-accent text-accent' />
                  ))}
                </div>

                <p className='text-sm sm:text-base text-foreground mb-4 sm:mb-6 leading-relaxed min-h-[80px]'>
                  &ldquo;{testimonial.content}&rdquo;
                </p>

                <div className='flex items-center gap-3 pt-4 border-t border-border'>
                  <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-mountains flex items-center justify-center shadow-sm'>
                    <span className='font-bold text-white text-xs sm:text-sm'>
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <p className='font-semibold text-sm sm:text-base text-foreground'>
                      {testimonial.name}
                    </p>
                    <p className='text-muted-foreground text-xs sm:text-sm'>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
