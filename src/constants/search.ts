import { DealType } from "@/types/common";
import { Home, Key, Calendar } from "lucide-react";

export const POPULAR_CITIES = ["Грозный", "Назрань", "Магас", "Гудермес"];

export const DEAL_TYPES: { value: DealType; label: string; icon: React.ElementType }[] = [
  { value: "buy", label: "Купить", icon: Home },
  { value: "rent", label: "Снять", icon: Key },
  { value: "daily", label: "Посуточно", icon: Calendar },
];
