"use client";

import { useState } from "react";
import {
  Scissors,
  Twitter,
  FileText,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from "lucide-react";
import type { JobData } from "@/lib/useJobPolling";

type Tab = "clips" | "thread" | "blog";

interface ResultViewerProps {
  job: JobData;
}

export default function ResultViewer({ job }: ResultViewerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("clips");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedClip, setExpandedClip] = useState<number | null>(null);

  const results = job.results;
  if (!results) return null;

  const viralClips = results.viral_clips ?? [];
  const xThread = results.x_thread ?? [];
  const blogArticle = results.blog_article ?? "";

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tabs = [
    {
      id: "clips" as Tab,
      label: "切り抜き候補",
      icon: Scissors,
      count: viralClips.length,
      color: "neon-blue",
    },
    {
      id: "thread" as Tab,
      label: "Xツリー案",
      icon: Twitter,
      count: xThread.length,
      color: "neon-purple",
    },
    {
      id: "blog" as Tab,
      label: "ブログ記事",
      icon: FileText,
      count: null,
      color: "neon-pink",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tab Bar */}
      <div className="flex gap-2 p-1.5 rounded-2xl glass">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
              ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-lg shadow-neon-blue/15"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`px-1.5 py-0.5 rounded-md text-[11px] ${
                  activeTab === tab.id
                    ? "bg-white/20"
                    : "bg-white/[0.06]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Viral Clips */}
        {activeTab === "clips" && (
          <div className="space-y-4">
            {viralClips.map((clip, i) => (
              <div
                key={i}
                className="rounded-2xl glass hover:neon-border transition-all duration-300 overflow-hidden group animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <button
                  onClick={() =>
                    setExpandedClip(expandedClip === i ? null : i)
                  }
                  className="w-full px-6 py-4 flex items-center gap-4 text-left"
                >
                  {/* Rank Badge */}
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue/15 to-neon-purple/15 flex items-center justify-center shrink-0 border border-neon-blue/10">
                    <span className="text-sm font-bold text-neon-blue">
                      #{i + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-100 truncate group-hover:text-neon-blue transition-colors duration-300">
                      {clip.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-500">
                        {clip.start_time} ~ {clip.end_time}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-neon-blue/50" />
                    {expandedClip === i ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>

                {expandedClip === i && (
                  <div className="px-6 pb-5 pt-0 animate-fade-in">
                    <div className="ml-14 p-4 rounded-xl bg-neon-blue/[0.04] border border-neon-blue/10">
                      <p className="text-xs font-medium text-neon-blue mb-1.5">
                        バズる理由
                      </p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {clip.reason}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* X Thread */}
        {activeTab === "thread" && (
          <div className="space-y-3">
            {/* Copy All */}
            <div className="flex justify-end">
              <button
                onClick={() =>
                  copyToClipboard(xThread.join("\n\n"), "all-thread")
                }
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium glass hover:neon-border transition-all duration-300"
              >
                {copiedId === "all-thread" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">コピー済み</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-400">すべてコピー</span>
                  </>
                )}
              </button>
            </div>

            {xThread.map((tweet, i) => (
              <div
                key={i}
                className="group relative rounded-2xl glass p-5 hover:neon-border-purple transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Thread Line */}
                {i < xThread.length - 1 && (
                  <div className="absolute left-8 top-14 bottom-0 w-px bg-gradient-to-b from-neon-purple/30 to-transparent translate-y-2" />
                )}

                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shrink-0 shadow-lg shadow-neon-blue/10">
                    <span className="text-xs font-bold text-white">
                      {i + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-100">
                        あなた
                      </span>
                      <span className="text-xs text-gray-600">
                        @your_handle
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {tweet}
                    </p>
                  </div>

                  {/* Copy button */}
                  <button
                    onClick={() => copyToClipboard(tweet, `tweet-${i}`)}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0 p-2 rounded-lg hover:bg-white/[0.06]"
                  >
                    {copiedId === `tweet-${i}` ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500 hover:text-neon-blue transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Blog Article */}
        {activeTab === "blog" && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Toolbar */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Markdown形式 ・ 約
                {blogArticle.length.toLocaleString()}文字
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    copyToClipboard(blogArticle, "blog")
                  }
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium glass hover:neon-border transition-all duration-300"
                >
                  {copiedId === "blog" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">コピー済み</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-400">Markdownをコピー</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Rendered Markdown */}
            <div className="rounded-2xl glass neon-border-purple p-8">
              <article className="prose prose-invert prose-sm max-w-none prose-headings:text-gray-100 prose-p:text-gray-300 prose-strong:text-gray-200 prose-li:text-gray-300 prose-a:text-neon-blue">
                <MarkdownRenderer content={blogArticle} />
              </article>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Simple Markdown Renderer */
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={key++}>
        {listItems.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
        ))}
      </ul>
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trimStart();

    const olMatch = trimmed.match(/^\d+\.\s+(.*)/);
    if (olMatch) {
      listItems.push(olMatch[1]);
      continue;
    }

    const ulMatch = trimmed.match(/^[-*]\s+(.*)/);
    if (ulMatch) {
      listItems.push(ulMatch[1]);
      continue;
    }

    flushList();

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3
          key={key++}
          dangerouslySetInnerHTML={{
            __html: inlineFormat(trimmed.slice(4)),
          }}
        />
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={key++}
          dangerouslySetInnerHTML={{
            __html: inlineFormat(trimmed.slice(3)),
          }}
        />
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h1
          key={key++}
          dangerouslySetInnerHTML={{
            __html: inlineFormat(trimmed.slice(2)),
          }}
        />
      );
    } else if (trimmed === "") {
      // skip blank
    } else {
      elements.push(
        <p
          key={key++}
          dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }}
        />
      );
    }
  }
  flushList();

  return <>{elements}</>;
}

function inlineFormat(text: string): string {
  let result = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return result;
}
