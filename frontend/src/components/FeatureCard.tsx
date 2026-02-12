"use client";

import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
}: FeatureCardProps) {
  return (
    <div className="group relative rounded-2xl glass p-6 hover:bg-white/[0.08] transition-all duration-300">
      {badge && (
        <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-600 text-white">
          {badge}
        </span>
      )}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-brand-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-100 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
