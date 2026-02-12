"use client";

import {
  Scissors,
  Twitter,
  FileText,
  Clock,
  Languages,
  BarChart3,
} from "lucide-react";
import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: Scissors,
    title: "バズ切り抜き検出",
    description:
      "動画内の盛り上がりポイントをAIが自動検出。タイムスタンプと「なぜバズるか」の理由付きで提案します。",
    badge: "CORE",
  },
  {
    icon: Twitter,
    title: "Xスレッド自動生成",
    description:
      "動画の要点を最大10連投のスレッド形式に変換。フック・構成・CTAまで最適化済み。",
    badge: "CORE",
  },
  {
    icon: FileText,
    title: "SEOブログ記事",
    description:
      "1,500文字のSEO最適化されたMarkdown記事を生成。メタ情報・見出し構造も自動で整形。",
    badge: "CORE",
  },
  {
    icon: Clock,
    title: "数分で完了",
    description:
      "動画のアップロードから全コンテンツ生成まで、わずか数分。手動作業の何時間もの工程を短縮。",
  },
  {
    icon: Languages,
    title: "多言語文字起こし",
    description:
      "Whisper APIによる高精度な文字起こし。日本語・英語をはじめ、多言語に対応。",
  },
  {
    icon: BarChart3,
    title: "分析ダッシュボード",
    description:
      "生成したコンテンツのパフォーマンスを一元管理。どの切り抜きが伸びたかを追跡。",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            1本の動画から、
            <span className="text-gradient">3つのコンテンツ</span>を生成
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            AIがあなたの動画を分析し、各プラットフォームに最適化されたコンテンツを自動で作成します。
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
