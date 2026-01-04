"use client";

import { Users, Home, Handshake, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const statistics = [
  {
    id: 1,
    label: "Активных объявлений",
    value: "2,500+",
    icon: Home,
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
  },
  {
    id: 2,
    label: "Довольных пользователей",
    value: "15,000+",
    icon: Users,
    color: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-500",
  },
  {
    id: 3,
    label: "Успешных сделок",
    value: "8,500+",
    icon: Handshake,
    color: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-500",
  },
  {
    id: 4,
    label: "Рост за месяц",
    value: "+25%",
    icon: TrendingUp,
    color: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500",
  },
];

export function StatisticsSection() {
  return (
    <section className='py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background to-muted/30'>
      <div className='container mx-auto px-4'>
        <div className='max-w-2xl mx-auto text-center mb-8 sm:mb-12'>
          <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4'>
            Платформа в цифрах
          </h2>
          <p className='text-muted-foreground text-sm sm:text-base'>
            Тысячи пользователей доверяют нам поиск и продажу недвижимости
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto'>
          {statistics.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.id}
                className='border-primary/10 bg-card/80 hover:shadow-lg hover:border-primary/30 transition-all hover:-translate-y-1'
              >
                <CardContent className='p-6 text-center'>
                  <div
                    className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                  >
                    <Icon className={`w-7 h-7 ${stat.iconColor}`} strokeWidth={2} />
                  </div>
                  <div className='text-3xl sm:text-4xl font-bold text-foreground mb-2'>
                    {stat.value}
                  </div>
                  <div className='text-sm sm:text-base text-muted-foreground font-medium'>
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
