"use client";

import { Sparkles } from "lucide-react";
import UploadArea from "./UploadArea";

interface HeroSectionProps {
  onJobStarted: (jobId: string) => void;
}

export default function HeroSection({ onJobStarted }: HeroSectionProps) {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        {/* Main glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-neon-blue/[0.07] rounded-full blur-[150px]" />
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[400px] bg-neon-purple/[0.05] rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-neon-pink/[0.03] rounded-full blur-[100px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 grid-bg opacity-50" />
      </div>

      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full neon-border bg-neon-blue/[0.05] text-sm text-neon-blue animate-fade-in">
          <Sparkles className="w-4 h-4" />
          <span>AI駆動のコンテンツ展開ツール</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] animate-fade-in-up">
          動画1本で、
          <br />
          <span className="text-gradient">SNSすべてを制覇する</span>
        </h1>

        {/* Sub */}
        <p className="max-w-2xl mx-auto text-lg text-gray-400 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          YouTubeの動画をアップロードするだけ。
          <br className="hidden sm:block" />
          バズる切り抜きポイント、Xスレッド、SEOブログ記事を
          <br className="hidden sm:block" />
          AIが数分で自動生成します。
        </p>

        {/* Upload */}
        <div className="pt-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <UploadArea onJobStarted={onJobStarted} />
        </div>
      </div>
    </section>
  );
}
