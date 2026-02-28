"use client";

import type { UseFormRegister, UseFormWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "../SectionCard";
import type { PropertyFormData } from "../schema";
import { FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface DescriptionSectionProps {
  register: UseFormRegister<PropertyFormData>;
  watch: UseFormWatch<PropertyFormData>;
  errors: Record<string, { message?: string } | undefined>;
}

export function DescriptionSection({ register, watch, errors }: DescriptionSectionProps) {
  const descLength = watch("description")?.length ?? 0;
  const isNearLimit = descLength >= 1800;

  return (
    <SectionCard title="Описание" icon={<FileText className="h-4 w-4 text-primary" />}>
      <div className="space-y-1.5">
        <Label htmlFor="description" className="flex items-center gap-2 text-sm font-medium">
          Подробное описание <span className="text-destructive">*</span>
          <span
            className={`ml-auto text-xs tabular-nums ${
              descLength >= 1900 ? "text-destructive font-medium" : isNearLimit ? "text-amber-600" : "text-muted-foreground"
            }`}
          >
            {descLength} / 2000
          </span>
        </Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Опишите расположение, состояние, инфраструктуру рядом..."
          rows={5}
          maxLength={2000}
          className="resize-y min-h-[100px] text-sm"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            if (target.value.length >= 2000) {
              toast.warning("Достигнут лимит 2000 символов", { duration: 1500 });
            }
          }}
        />
        {errors.description ? (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {errors.description.message}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Минимум 50 символов</p>
        )}
      </div>
      {isNearLimit && (
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${Math.min((descLength / 2000) * 100, 100)}%`,
              backgroundColor:
                descLength >= 2000 ? "hsl(var(--destructive))" : descLength >= 1900 ? "hsl(var(--destructive) / 0.8)" : "hsl(var(--primary))",
            }}
          />
        </div>
      )}
    </SectionCard>
  );
}
