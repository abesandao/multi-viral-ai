"use client";

import { useState, useRef, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import StepsSection from "@/components/StepsSection";
import CtaSection from "@/components/CtaSection";
import JobProgress from "@/components/JobProgress";
import ResultViewer from "@/components/ResultViewer";
import { useJobPolling } from "@/lib/useJobPolling";

function JobSection({
  jobId,
  onReset,
}: {
  jobId: string;
  onReset: () => void;
}) {
  const { job, loading, pollError, refetch } = useJobPolling(jobId, 3000);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (job?.status === "completed" && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
    }
  }, [job?.status, job?.results]);

  if (loading && !job) {
    return (
      <div className="py-20 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl neon-border bg-neon-blue/[0.03]">
          <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
          <p className="text-sm text-gray-400">
            ジョブ情報を取得中...
          </p>
        </div>
      </div>
    );
  }

  if (pollError) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm text-red-400">{pollError}</p>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm rounded-lg glass hover:neon-border transition-all duration-300"
        >
          最初に戻る
        </button>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="space-y-12">
      {/* Progress */}
      <JobProgress status={job.status} error={job.error} />

      {/* Results - 完了時は必ず結果エリアを表示 */}
      {job.status === "completed" && (
        <div ref={resultRef} className="animate-fade-in-up space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold">
              生成された<span className="text-gradient">コンテンツ</span>
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              各タブをクリックして確認・コピーできます
            </p>
          </div>

          {job.results ? (
            <ResultViewer job={job} />
          ) : (
            <div className="rounded-2xl glass p-12 text-center space-y-4">
              <p className="text-gray-400">結果を読み込み中...</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 text-sm rounded-lg bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 transition-colors"
              >
                再取得
              </button>
            </div>
          )}

          {/* New Analysis Button */}
          <div className="text-center pt-4">
            <button
              onClick={onReset}
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium glass hover:neon-border transition-all duration-300"
            >
              <RotateCcw className="w-4 h-4 group-hover:text-neon-blue transition-colors" />
              <span className="group-hover:text-neon-blue transition-colors">別の動画を分析する</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Reset */}
      {job.status === "error" && (
        <div className="text-center">
          <button
            onClick={onReset}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium glass hover:neon-border transition-all duration-300"
          >
            <RotateCcw className="w-4 h-4 group-hover:text-neon-blue transition-colors" />
            <span className="group-hover:text-neon-blue transition-colors">もう一度試す</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const jobSectionRef = useRef<HTMLDivElement>(null);

  const handleJobStarted = (jobId: string) => {
    setActiveJobId(jobId);
    setTimeout(() => {
      jobSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleReset = () => {
    setActiveJobId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Header />

      <main className="flex-1">
        <HeroSection onJobStarted={handleJobStarted} />

        {activeJobId && (
          <section
            ref={jobSectionRef}
            className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.05]"
          >
            <div className="max-w-5xl mx-auto">
              <JobSection jobId={activeJobId} onReset={handleReset} />
            </div>
          </section>
        )}

        <FeaturesSection />
        <StepsSection />
        <CtaSection />
      </main>

      <footer className="border-t border-white/[0.05] py-8 px-4 text-center text-sm text-gray-600">
        <p>&copy; 2026 Multi-Viral AI. All rights reserved.</p>
      </footer>
    </>
  );
}
