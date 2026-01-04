import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className='py-16 sm:py-20 gradient-mountains relative overflow-hidden'>
      <div className='absolute inset-0 pattern-caucasus opacity-30' />
      <div className='container mx-auto px-4 relative z-10'>
        <div className='max-w-3xl mx-auto text-center'>
          <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6'>
            Готовы найти свой дом на Кавказе?
          </h2>
          <p className='text-base sm:text-lg text-white/90 mb-6 sm:mb-8 leading-relaxed px-2'>
            Присоединяйтесь к тысячам довольных пользователей на Кавказе.
          </p>

          <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center'>
            <Link href='/sell'>
              <Button
                size='lg'
                className='bg-white hover:bg-white/90 text-primary gap-2 font-semibold shadow-lg hover:shadow-xl transition-all min-h-[48px] w-full sm:w-auto'
              >
                Разместить объявление
                <ArrowRight className='w-4 h-4' />
              </Button>
            </Link>
            <Link href='/search'>
              <Button
                size='lg'
                variant='outline'
                className='border-2 border-white text-primary hover:bg-white/20 hover:text-white backdrop-blur-sm min-h-[48px] w-full sm:w-auto'
              >
                Начать поиск
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
