"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Check } from "lucide-react";

export function PremiumCtaCard() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/premium");
  };

  return (
    <Card className='border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 dark:border-amber-800'>
      <CardContent className='p-4 sm:p-6 text-center space-y-4'>
        <div className='w-10 h-10 sm:w-14 sm:h-14 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg'>
          <Crown className='w-5 h-5 sm:w-7 sm:h-7 text-white' />
        </div>
        <div>
          <h3 className='font-semibold text-base sm:text-lg'>Станьте Premium</h3>
          <p className='text-xs sm:text-sm text-muted-foreground mt-1'>
            Разблокируйте все возможности платформы
          </p>
        </div>
        <ul className='text-xs text-left space-y-2'>
          <li className='flex items-center gap-2'>
            <Check className='w-4 h-4 text-green-500 shrink-0' />
            <span>Приоритетная поддержка</span>
          </li>
          <li className='flex items-center gap-2'>
            <Check className='w-4 h-4 text-green-500 shrink-0' />
            <span>Расширенная аналитика</span>
          </li>
          <li className='flex items-center gap-2'>
            <Check className='w-4 h-4 text-green-500 shrink-0' />
            <span>Без ограничений</span>
          </li>
        </ul>
        <Button
          className='w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-md'
          onClick={handleClick}
        >
          <Sparkles className='w-4 h-4 mr-2' />
          Активировать Premium
        </Button>
      </CardContent>
    </Card>
  );
}
