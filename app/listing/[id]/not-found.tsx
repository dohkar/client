import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { ArrowLeft } from "lucide-react";

export default function ListingNotFound() {
  return (
    <div className="container max-w-lg mx-auto py-16 px-4 text-center">
      <h1 className="text-2xl font-bold mb-2">Объявление не найдено</h1>
      <p className="text-muted-foreground mb-6">
        Возможно, оно было удалено или ссылка неверна.
      </p>
      <Button asChild>
        <Link href={ROUTES.search}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться к поиску
        </Link>
      </Button>
    </div>
  );
}
