import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MobileFilterDrawer } from "@/components/features/MobileFilterDrawer";
import type { MobileFilterDrawerProps } from "@/components/features/MobileFilterDrawer";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Если передан — на мобильных отображается кнопка «Фильтры» и drawer (на сегментных страницах). На /search не используется. */
  filterProps?: MobileFilterDrawerProps;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Поиск по городу, улице или названию",
  filterProps,
}: SearchInputProps) {
  return (
    <div className='flex flex-col gap-3 mb-4'>
      <div className='flex flex-col sm:flex-row gap-3'>
        <div className='flex-1 relative'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder={placeholder}
            className='pl-9 h-11'
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete='off'
          />
        </div>
        {filterProps && (
          <div className='flex sm:hidden justify-end'>
            <MobileFilterDrawer {...filterProps} />
          </div>
        )}
      </div>
    </div>
  );
}
