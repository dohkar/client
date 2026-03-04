"use client";

import Link from "next/link";
import { MapPin, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { POPULAR_CITIES } from "@/constants/search";
import { buildSearchUrl } from "@/lib/url/segments";

const LOCATION_META: Record<string, { description: string; properties: string; trend: string }> = {
  groznyy: { description: "Столица Чечни", properties: "850+", trend: "+15%" },
  nazran: { description: "Крупнейший город Ингушетии", properties: "420+", trend: "+22%" },
  magas: { description: "Столица Ингушетии", properties: "280+", trend: "+18%" },
  gudermes: { description: "Второй по величине город", properties: "320+", trend: "+12%" },
};

const locations = POPULAR_CITIES.map((city, index) => ({
  id: index + 1,
  name: city.label,
  description: LOCATION_META[city.slug]?.description ?? "Популярная локация",
  properties: LOCATION_META[city.slug]?.properties ?? "100+",
  trend: LOCATION_META[city.slug]?.trend ?? "+10%",
  href: buildSearchUrl({
    region: city.region,
    category: "nedvizhimost",
    dealType: "prodam",
    params: {
      query: city.label,
    },
  }),
  image: "gradient-mountains",
}));

export function PopularLocationsSection() {
  return (
    <section className='py-12 sm:py-16 md:py-20 bg-background'>
      <div className='container mx-auto px-4'>
        <div className='max-w-2xl mx-auto text-center mb-8 sm:mb-12'>
          <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4'>
            Популярные локации
          </h2>
          {/* <p className='text-muted-foreground text-sm sm:text-base'>
            Самые востребованные города и районы
          </p> */}
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto'>
          {locations.map((location) => (
            <Link
              key={location.id}
              href={location.href}
              className='group outline-none transition-smooth'
              aria-label={`Поиск в ${location.name}`}
            >
              <Card className='border-primary/10 bg-card/80 hover:shadow-xl hover:border-primary/30 transition-all hover:-translate-y-2 h-full overflow-hidden'>
                <div className={`${location.image} h-32 relative`}>
                  <div className='absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors' />
                  <div className='absolute top-3 right-3'>
                    <Badge
                      variant='secondary'
                      className='bg-white/90 text-primary flex items-center gap-1'
                    >
                      <TrendingUp className='w-3 h-3' />
                      {location.trend}
                    </Badge>
                  </div>
                </div>
                <CardContent className='p-5 sm:p-6'>
                  <div className='flex items-start justify-between mb-2'>
                    <div className='flex items-center gap-2'>
                      <MapPin className='w-5 h-5 text-primary' />
                      <h3 className='text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors'>
                        {location.name}
                      </h3>
                    </div>
                  </div>
                  <p className='text-sm text-muted-foreground mb-3'>
                    {location.description}
                  </p>
                  <div className='flex items-center gap-2 text-sm'>
                    <span className='font-semibold text-foreground'>
                      {location.properties}
                    </span>
                    <span className='text-muted-foreground'>объявлений</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
