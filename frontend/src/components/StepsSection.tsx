"use client";

import { ArrowRight } from "lucide-react";

const steps = [
  {
    num: "01",
    title: "動画をアップロード",
    desc: "YouTube URLを貼るか、動画/音声ファイルをドラッグ＆ドロップ。",
  },
  {
    num: "02",
    title: "AIが自動分析",
    desc: "文字起こし → バズポイント検出 → コンテンツ生成を自動実行。",
  },
  {
    num: "03",
    title: "コンテンツを展開",
    desc: "生成された切り抜き候補・Xスレッド・ブログ記事をワンクリックで活用。",
  },
];

export default function StepsSection() {
  return (
    <section
      id="how"
      className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/5 scroll-mt-20"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            使い方は<span className="text-gradient">3ステップ</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.num} className="relative text-center space-y-4">
              {i < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute -right-4 top-8 w-8 h-8 text-white/10" />
              )}
              <div className="text-5xl font-black text-brand-600/30">
                {s.num}
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="text-sm text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
