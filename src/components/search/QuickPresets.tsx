import { Button } from "@/components/ui/button";
import { QUICK_PRESETS } from "@/lib/search-constants";
import type { PropertyFilters } from "@/stores";

interface QuickPresetsProps {
  onPresetSelect: (
    filters: Partial<PropertyFilters>,
    localPriceMin?: string,
    localPriceMax?: string
  ) => void;
}

export function QuickPresets({ onPresetSelect }: QuickPresetsProps) {
  return (
    <div className='mb-6 flex flex-wrap gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
      {QUICK_PRESETS.map((preset) => (
        <Button
          key={preset.label}
          variant='outline'
          size='sm'
          className='shrink-0 h-8 transition-all hover:bg-primary hover:text-primary-foreground'
          onClick={() => {
            // Определяем локальные значения цены для пресета
            const localPriceMin =
              preset.filters.priceMin != null
                ? String(preset.filters.priceMin)
                : "";
            const localPriceMax =
              preset.filters.priceMax != null
                ? String(preset.filters.priceMax)
                : "";

            onPresetSelect(preset.filters, localPriceMin, localPriceMax);
          }}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
