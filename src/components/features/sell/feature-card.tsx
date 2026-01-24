"use client";

import { CheckCircle2 } from "lucide-react";

interface FeatureCardProps {
  feature: string;
  index: number;
}

export function FeatureCard({ feature, index }: FeatureCardProps) {
  return (
    <div
      className="group flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-md focus-within:ring-2 focus-within:ring-primary/20 focus-within:outline-none"
      style={{
        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      <CheckCircle2
        className="w-5 h-5 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300"
        aria-hidden="true"
      />
      <span className="text-sm sm:text-base text-foreground font-medium leading-relaxed">
        {feature}
      </span>
    </div>
  );
}
