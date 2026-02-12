"use client";

import { use } from "react";
import { ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import { useJobPolling } from "@/lib/useJobPolling";
import JobProgress from "@/components/JobProgress";
import ResultViewer from "@/components/ResultViewer";

export default function JobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const { job, loading, pollError } = useJobPolling(jobId);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                戻る
              </Link>
              <div className="h-5 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold">Multi-Viral AI</span>
              </div>
            </div>

            {job && (
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    job.status === "completed"
                      ? "bg-emerald-400"
                      : job.status === "error"
                        ? "bg-red-400"
                        : "bg-brand-400 animate-pulse"
                  }`}
                />
                <span className="text-xs text-gray-400 font-mono">
                  {jobId.slice(0, 8)}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        {loading && !job ? (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-brand-400 animate-pulse" />
            </div>
            <p className="text-sm text-gray-400">ジョブ情報を取得中...</p>
          </div>
        ) : pollError ? (
          <div className="max-w-2xl mx-auto text-center py-20">
            <p className="text-sm text-red-400">{pollError}</p>
          </div>
        ) : job ? (
          <div className="space-y-10">
            {/* Progress Section */}
            <JobProgress status={job.status} error={job.error} />

            {/* Results Section (only when completed) */}
            {job.status === "completed" && job.results && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold">
                    生成された
                    <span className="text-gradient">コンテンツ</span>
                  </h2>
                  <p className="mt-2 text-sm text-gray-400">
                    各タブをクリックして確認・コピーできます
                  </p>
                </div>
                <ResultViewer job={job} />
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
