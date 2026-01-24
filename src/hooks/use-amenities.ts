import { useState, useEffect, useMemo, useCallback } from "react";
import { FEATURE_OPTIONS, FEATURE_CATEGORIES } from "@/constants/feature-categories";
import type { FeatureOption } from "@/constants/feature-categories";

export interface UseAmenitiesOptions {
  initialFeatures?: string[];
}

export interface UseAmenitiesReturn {
  selectedFeatures: string[];
  customFeature: string;
  setCustomFeature: (value: string) => void;
  toggleFeature: (featureId: string) => void;
  addCustomFeature: () => void;
  removeFeature: (feature: string) => void;
  featuresByCategory: Record<keyof typeof FEATURE_CATEGORIES, FeatureOption[]>;
  getFeaturesLabels: () => string[];
  resetFeatures: () => void;
}

/**
 * Хук для управления удобствами (amenities/features) в форме недвижимости
 */
export function useAmenities({ initialFeatures = [] }: UseAmenitiesOptions = {}): UseAmenitiesReturn {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customFeature, setCustomFeature] = useState("");

  // Инициализация features при редактировании
  // Преобразуем label -> id для предустановленных features
  useEffect(() => {
    if (initialFeatures.length > 0) {
      const mappedFeatures = initialFeatures.map((featureLabel) => {
        // Ищем по label в предустановленных опциях
        const option = FEATURE_OPTIONS.find((f) => f.label === featureLabel);
        // Если найдено - используем id, иначе оставляем как есть (кастомное)
        return option?.id || featureLabel;
      });
      setSelectedFeatures(mappedFeatures);
    }
  }, [initialFeatures]);

  // Группировка features по категориям (мемоизировано)
  const featuresByCategory = useMemo(
    () =>
      FEATURE_OPTIONS.reduce(
        (acc, feature) => {
          if (!acc[feature.category]) {
            acc[feature.category] = [];
          }
          acc[feature.category].push(feature);
          return acc;
        },
        {} as Record<keyof typeof FEATURE_CATEGORIES, FeatureOption[]>
      ),
    []
  );

  // Переключение feature (добавить/удалить)
  const toggleFeature = useCallback((featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((f) => f !== featureId)
        : [...prev, featureId]
    );
  }, []);

  // Добавление кастомного feature
  const addCustomFeature = useCallback(() => {
    const trimmed = customFeature.trim();
    if (trimmed && !selectedFeatures.includes(trimmed)) {
      setSelectedFeatures((prev) => [...prev, trimmed]);
      setCustomFeature("");
    }
  }, [customFeature, selectedFeatures]);

  // Удаление feature
  const removeFeature = useCallback((feature: string) => {
    setSelectedFeatures((prev) => prev.filter((f) => f !== feature));
  }, []);

  // Преобразование features: ID -> Label для предустановленных, оставляем как есть для кастомных
  const getFeaturesLabels = useCallback((): string[] => {
    return selectedFeatures.map((feature) => {
      const option = FEATURE_OPTIONS.find((f) => f.id === feature);
      return option?.label || feature;
    });
  }, [selectedFeatures]);

  // Сброс всех features
  const resetFeatures = useCallback(() => {
    setSelectedFeatures([]);
    setCustomFeature("");
  }, []);

  return {
    selectedFeatures,
    customFeature,
    setCustomFeature,
    toggleFeature,
    addCustomFeature,
    removeFeature,
    featuresByCategory,
    getFeaturesLabels,
    resetFeatures,
  };
}
