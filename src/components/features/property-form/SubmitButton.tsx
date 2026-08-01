"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChevronRight } from "lucide-react";

interface SubmitButtonProps {
  isLoading: boolean;
  isUploadingMedia: boolean;
  isEdit: boolean;
  disabled?: boolean;
  /** Если задано — кнопка не отправляет форму нативно (многошаговые формы). */
  onPressSubmit?: () => void;
}

export function SubmitButton({
  isLoading,
  isUploadingMedia,
  isEdit,
  disabled,
  onPressSubmit,
}: SubmitButtonProps) {
  const isDisabled = disabled ?? (isLoading || isUploadingMedia);

  return (
    <div className='flex justify-end w-full'>
      <Button
        type={onPressSubmit ? "button" : "submit"}
        size='lg'
        className='w-full md:w-auto md:min-w-[220px] h-12 font-semibold text-base'
        disabled={isDisabled}
        onClick={onPressSubmit}
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
