"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChevronRight } from "lucide-react";

interface SubmitButtonProps {
  isLoading: boolean;
  isUploadingMedia: boolean;
  isEdit: boolean;
  disabled?: boolean;
}

export function SubmitButton({
  isLoading,
  isUploadingMedia,
  isEdit,
  disabled,
}: SubmitButtonProps) {
  const isDisabled = disabled ?? (isLoading || isUploadingMedia);

  return (
    <div className='sticky bottom-0 left-0 right-0 z-10 pt-1 pb-2 px-2 md:pt-2 md:pb-3 md:px-0 bg-background/95 backdrop-blur-[2px] supports-[backdrop-filter]:bg-background/80 border-t border-border md:border-0 md:bg-transparent md:shadow-none flex justify-end'>
      <Button
        type='submit'
        size='lg'
        className='w-full md:w-auto md:min-w-[220px] h-12 font-semibold text-base'
        disabled={isDisabled}
      >
        {isLoading ? (
          <>
            <Spinner className='h-5 w-5 mr-2' />
            {isEdit ? "Сохранение…" : "Создание…"}
          </>
        ) : isUploadingMedia ? (
          <>
            <Spinner className='h-5 w-5 mr-2' />
            Загрузка медиа…
          </>
        ) : (
          <>
            {isEdit ? "Сохранить изменения" : "Создать объявление"}
            <ChevronRight className='h-5 w-5 ml-1' />
          </>
        )}
      </Button>
    </div>
  );
}
