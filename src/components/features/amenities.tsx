"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, X, Check, Plus } from "lucide-react";
import { FEATURE_OPTIONS, FEATURE_CATEGORIES } from "@/constants/feature-categories";
import type { FeatureOption } from "@/constants/feature-categories";
import type { UseAmenitiesReturn } from "@/hooks/use-amenities";

export interface AmenitiesSelectorProps {
  selectedFeatures: string[];
  customFeature: string;
  setCustomFeature: (value: string) => void;
  toggleFeature: (id: string) => void;
  addCustomFeature: () => void;
  removeFeature: (id: string) => void;
  featuresByCategory: Record<keyof typeof FEATURE_CATEGORIES, FeatureOption[]>;
}

/**
 * Компонент для выбора удобств (amenities) недвижимости
 */
export function AmenitiesSelector({
  selectedFeatures,
  customFeature,
  setCustomFeature,
  toggleFeature,
  addCustomFeature,
  removeFeature,
  featuresByCategory,
}: AmenitiesSelectorProps) {
  return (
    <Card className="border-primary/20 shadow-lg transition-all hover:shadow-xl">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="w-5 h-5 text-primary" />
          Удобства и особенности
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Выбранные удобства */}
        {selectedFeatures.length > 0 && (
          <div className="space-y-3">
            <Label className="text-base font-medium">Выбранные удобства</Label>
            <div className="flex flex-wrap gap-2">
              {selectedFeatures.map((feature) => {
                const option = FEATURE_OPTIONS.find((f) => f.id === feature);
                const Icon = option?.icon || Sparkles;
                return (
                  <Badge
                    key={feature}
                    variant="secondary"
                    className="px-3 py-1.5 text-sm flex items-center gap-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={() => removeFeature(feature)}
                    aria-label={`Удалить удобство: ${option?.label || feature}`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    {option?.label || feature}
                    <X className="w-3 h-3 ml-1" aria-hidden="true" />
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Категории удобств */}
        <div className="space-y-6">
          {(Object.keys(FEATURE_CATEGORIES) as Array<keyof typeof FEATURE_CATEGORIES>).map(
            (category) => {
              const features = featuresByCategory[category] || [];
              if (features.length === 0) return null;

              return (
                <div key={String(category)} className="space-y-3">
                  <Label className="text-base font-medium text-foreground">
                    {FEATURE_CATEGORIES[category]}
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {features.map((feature) => {
                      const Icon = feature.icon;
                      const isSelected = selectedFeatures.includes(feature.id);
                      return (
                        <button
                          key={feature.id}
                          type="button"
                          onClick={() => toggleFeature(feature.id)}
                          className={`
                            flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
                            text-left text-sm font-medium
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2
                            ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                : "border-border bg-background hover:border-primary/50 hover:bg-muted/50"
                            }
                          `}
                          aria-label={`${isSelected ? "Убрать" : "Добавить"} удобство: ${feature.label}`}
                          aria-pressed={isSelected}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? "text-primary" : "text-muted-foreground"
                            }`}
                            aria-hidden="true"
                          />
                          <span className="flex-1">{feature.label}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Добавить своё удобство */}
        <div className="space-y-3 pt-4 border-t">
          <Label htmlFor="custom-amenity" className="text-base font-medium">
            Добавить своё удобство
          </Label>
          <div className="flex gap-2">
            <Input
              id="custom-amenity"
              value={customFeature}
              onChange={(e) => setCustomFeature(e.target.value)}
              placeholder="Например: Вид на мечеть, Родник, и т.д."
              className="h-11 text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomFeature();
                }
              }}
              aria-label="Поле для ввода своего удобства"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustomFeature}
              disabled={!customFeature.trim() || selectedFeatures.includes(customFeature.trim())}
              className="h-11 px-4"
              aria-label="Добавить своё удобство"
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Добавить
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Нажмите Enter или кнопку &quot;Добавить&quot; чтобы добавить своё удобство
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
