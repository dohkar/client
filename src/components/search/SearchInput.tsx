import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MobileFilterDrawer } from "@/components/features/MobileFilterDrawer";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Поиск по городу, улице или названию",
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
        <div className='flex sm:hidden justify-end'>
          <MobileFilterDrawer />
        </div>
      </div>
    </div>
  );
}
