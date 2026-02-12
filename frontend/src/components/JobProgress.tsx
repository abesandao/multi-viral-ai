"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Mic,
  Brain,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    id: "uploaded",
    label: "アップロード完了",
    description: "準備を開始しています...",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: "processing",
    label: "準備中",
    description: "ジョブを初期化しています...",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: "downloading",
    label: "YouTube ダウンロード中",
    description: "音声を取得しています...",
    icon: <Download className="w-5 h-5" />,
  },
  {
    id: "transcribing",
    label: "文字起こし中",
    description: "Whisper AIが音声を解析しています...",
    icon: <Mic className="w-5 h-5" />,
  },
  {
    id: "generating",
    label: "コンテンツ生成中",
    description: "AIがバズるコンテンツを練り上げています...",
    icon: <Brain className="w-5 h-5" />,
  },
  {
    id: "completed",
    label: "完了",
    description: "すべてのコンテンツが生成されました！",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
];

const FACTS = [
  "AIが動画の感情曲線を分析中...",
  "バズるフレーズを検出しています...",
  "Xのアルゴリズムに最適化中...",
  "SEOキーワードを抽出しています...",
  "切り抜きポイントをスコアリング中...",
  "記事の構成を最適化中...",
  "エンゲージメント予測を計算中...",
  "ハッシュタグ戦略を策定中...",
];

interface JobProgressProps {
  status: string;
  error?: string | null;
}

export default function JobProgress({ status, error }: JobProgressProps) {
  const [factIdx, setFactIdx] = useState(0);
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    if (status === "completed" || status === "error") return;
    const interval = setInterval(() => {
      setFactIdx((prev) => (prev + 1) % FACTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status === "completed" || status === "error") return;
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, [status]);

  const currentStepIdx = STEPS.findIndex((s) => s.id === status);
  const progress =
    status === "completed"
      ? 100
      : status === "error"
        ? 0
        : Math.max(((currentStepIdx + 0.5) / (STEPS.length - 1)) * 100, 5);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl glass p-8 text-center space-y-4 border-red-500/20">
          <div className="relative mx-auto w-fit">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-red-400/20 blur-md -z-10" />
          </div>
          <h2 className="text-lg font-semibold text-red-400">
            エラーが発生しました
          </h2>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      {/* Main Progress Card */}
      <div className="rounded-2xl glass neon-border p-8 space-y-6">
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              status === "completed"
                ? "bg-emerald-500/10"
                : "bg-gradient-to-br from-neon-blue/10 to-neon-purple/10"
            }`}>
              {status === "completed" ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              ) : (
                <Loader2 className="w-10 h-10 text-neon-blue animate-spin" />
              )}
            </div>
            {status !== "completed" && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-neon-blue/20 animate-ping" />
                <div
                  className="absolute inset-0 rounded-full border border-neon-purple/15 animate-ping"
                  style={{ animationDelay: "0.5s" }}
                />
              </>
            )}
            {status === "completed" && (
              <div className="absolute inset-0 w-20 h-20 rounded-full bg-emerald-400/10 blur-lg -z-10" />
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center">
          <h2 className="text-xl font-bold">
            {status === "completed" ? (
              <span className="text-emerald-400">生成完了！</span>
            ) : (
              <>
                {STEPS.find((s) => s.id === status)?.label ?? "処理中"}
                <span className="text-neon-blue">
                  {".".repeat(dotCount)}
                </span>
              </>
            )}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {STEPS.find((s) => s.id === status)?.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                status === "completed"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                  : "bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-[length:200%_100%] animate-gradient shadow-[0_0_10px_rgba(0,212,255,0.4)]"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{Math.round(progress)}%</span>
            <span>
              {status === "completed" ? "完了" : "処理中"}
            </span>
          </div>
        </div>

        {/* Fun Fact Ticker */}
        {status !== "completed" && (
          <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neon-blue/[0.04] border border-neon-blue/[0.08]">
            <Sparkles className="w-4 h-4 text-neon-blue shrink-0 animate-neon-flicker" />
            <p
              key={factIdx}
              className="text-sm text-gray-400 animate-fade-in"
            >
              {FACTS[factIdx]}
            </p>
          </div>
        )}
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STEPS.map((step, i) => {
          const isCurrent = step.id === status && status !== "completed";
          const isDone = currentStepIdx > i || status === "completed";
          return (
            <div
              key={step.id}
              className={`
                rounded-xl p-3 text-center transition-all duration-500
                ${
                  isCurrent
                    ? "neon-border bg-neon-blue/[0.04] scale-105"
                    : isDone
                      ? "bg-emerald-500/[0.06] border border-emerald-500/20"
                      : "bg-white/[0.02] border border-white/[0.05]"
                }
              `}
            >
              <div
                className={`mx-auto mb-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isCurrent
                    ? "bg-neon-blue/15 text-neon-blue"
                    : isDone
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-white/[0.04] text-gray-600"
                }`}
              >
                {isDone && !isCurrent ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  step.icon
                )}
              </div>
              <p
                className={`text-xs font-medium ${
                  isCurrent
                    ? "text-neon-blue"
                    : isDone
                      ? "text-emerald-400"
                      : "text-gray-600"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
