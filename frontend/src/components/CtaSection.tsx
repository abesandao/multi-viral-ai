"use client";

import { Zap } from "lucide-react";

export default function CtaSection() {
  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20">
      <div className="max-w-3xl mx-auto text-center rounded-3xl glass glow p-12 space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center mx-auto">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-3xl font-bold">
          今すぐ、コンテンツの
          <span className="text-gradient">量産体制</span>へ
        </h2>
        <p className="text-gray-400">
          無料プランで今すぐ始められます。クレジットカード不要。
        </p>
        <button className="px-8 py-3 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 transition-colors">
          無料で始める
        </button>
      </div>
    </section>
  );
}
